import moment from 'moment';
import qs from 'qs';
import crypto from 'crypto';
import { Order } from '../orders/orders.model.js';
import Invoice from '../invoice/Invoice.model.js';
import Table from '../tables/tables.model.js';
import handleAsync from '../../shared/utils/handleAsync.js';
import { vnpayConfig } from '../../shared/configs/vnpay.configs.js';
import Payment from './payments.model.js';
import createResponse from '../../shared/utils/createResponse.js';
import { OrderItem } from '../order_items/order_items.model.js';
import { getIO } from '../../shared/utils/socket.js';

// --- HÀM HELPER ---
function sortObject(obj) {
    let sorted = {};
    let str = Object.keys(obj).map(key => encodeURIComponent(key)).sort();
    for (let key of str) {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    }
    return sorted;
}

const calculateServedAmount = async (orderIds) => {
    const items = await OrderItem.find({
        order_id: { $in: orderIds },
        // Kiểm tra cả 2 loại trạng thái để tránh sót dữ liệu
        status: { $in: ['served', 'Đã phục vụ'] }
    });
    return items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
};

// ==========================================
// 1. THANH TOÁN VNPAY (MOBILE)
// ==========================================
export const createPaymentUrl = handleAsync(async (req, res) => {
    const { table_id, bankCode } = req.body;

    const table = await Table.findOne({ table_number: table_id });
    if (!table) return res.status(404).json({ message: "Không tìm thấy bàn" });

    const activeOrders = await Order.find({
        table_id: table._id,
        status: { $nin: ['completed', 'cancelled', 'canceled'] }
    });

    if (!activeOrders.length) return res.status(400).json({ message: "Bàn trống hoặc không có đơn hàng cần thanh toán" });

    const orderIds = activeOrders.map(o => o._id);
    const amount = await calculateServedAmount(orderIds);

    if (amount <= 0) {
        return res.status(400).json({ message: "Chưa có món nào được phục vụ (served) để tính tiền" });
    }

    const invoice = await Invoice.create({
        invoice_number: `INV${moment().format('YYYYMMDDHHmmss')}`,
        table_id: table._id,
        order_ids: orderIds,
        total_amount: amount,
        status: 'unpaid',
        payment_method: 'vnpay'
    });

    let vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': vnpayConfig.vnp_TmnCode,
        'vnp_Locale': 'vn',
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': invoice._id.toString(),
        'vnp_OrderInfo': `Thanh toan Roosta - Ban ${table.table_number}`,
        'vnp_OrderType': 'other',
        'vnp_Amount': amount * 100,
        'vnp_ReturnUrl': vnpayConfig.vnp_ReturnUrl,
        'vnp_IpAddr': req.headers['x-forwarded-for'] || req.socket.remoteAddress || "127.0.0.1",
        'vnp_CreateDate': moment().format('YYYYMMDDHHmmss')
    };

    if (bankCode) vnp_Params['vnp_BankCode'] = bankCode;
    vnp_Params = sortObject(vnp_Params);
    let signData = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;

    return res.status(200).json({
        paymentUrl: vnpayConfig.vnp_Url + '?' + qs.stringify(vnp_Params, { encode: false }),
        amount
    });
});

// ==========================================
// 2. THANH TOÁN TẠI QUẦY (OFFLINE - POS)
// ==========================================
export const processCounterPayment = handleAsync(async (req, res) => {
    const { table_id, method, note, split_count } = req.body;

    const table = await Table.findOne({ table_number: table_id });
    if (!table) return res.status(404).json({ message: "Không tìm thấy bàn" });

    const activeOrders = await Order.find({
        table_id: table._id,
        status: { $nin: ['completed', 'cancelled', 'canceled'] }
    });

    if (!activeOrders.length) return res.status(404).json({ message: "Bàn không có đơn hàng hoạt động" });
    const orderIds = activeOrders.map(o => o._id);

    const finalAmount = await calculateServedAmount(orderIds);
    if (finalAmount <= 0) {
        return res.status(400).json({ message: "Chưa có món nào được phục vụ để thanh toán" });
    }

    const invoice = await Invoice.create({
        invoice_number: `INV-POS-${Date.now()}`,
        table_id: table._id,
        order_ids: orderIds,
        total_amount: finalAmount,
        status: 'paid',
        payment_method: method || 'cash',
        split_count: split_count || 1
    });

    await Payment.create({
        invoice_id: invoice._id,
        method: method || 'cash',
        amount_paid: finalAmount,
        status: 'success',
        transaction_id: `OFFLINE-${Date.now()}`,
        note: note || `Thanh toán tại quầy`
    });

    // Đồng bộ: Đóng Order và Giải phóng bàn
    await Order.updateMany({ _id: { $in: orderIds } }, { $set: { status: 'completed' } });
    await Table.findByIdAndUpdate(table._id, { status: 'available' });

    return createResponse(res, 201, "Thanh toán thành công!", invoice);
});

// ==========================================
// 3. THANH TOÁN SEPAY (WEBHOOK)
// ==========================================
export const handleSepayWebhook = async (req, res) => {
    try {
        const { transferAmount, content, transferType } = req.body;
        if (transferType !== 'in') return res.status(200).send("OK");

        console.log("-> SePay Content:", content);

        const match = content.match(/ROOSTA([A-Z0-9]+)/i);
        if (!match) return res.status(200).send("OK");
        const orderShortCode = match[1].toLowerCase();

        console.log("-> Trích xuất mã đơn:", orderShortCode);

        // 1. TÌM ĐƠN HÀNG (Dùng lệnh $substr cơ bản nhất, an toàn 100%)
        const leadOrder = await Order.findOne({
            $expr: { $eq: [{ $toLower: { $substr: [{ $toString: "$_id" }, 18, 6] } }, orderShortCode] }
        });

        if (!leadOrder) {
            console.log("-> Không tìm thấy đơn hàng cho mã:", orderShortCode);
            return res.status(200).send("OK");
        }

        const table = await Table.findById(leadOrder.table_id);
        if (!table) return res.status(200).send("OK");

        const activeOrders = await Order.find({
            table_id: table._id,
            status: { $nin: ['completed', 'cancelled', 'canceled'] }
        });

        if (!activeOrders.length) return res.status(200).send("OK");
        const orderIds = activeOrders.map(o => o._id);

        let finalAmount = await calculateServedAmount(orderIds);
        const billingAmount = finalAmount > 0 ? finalAmount : Number(transferAmount);

        // 2. TẠO HÓA ĐƠN & THANH TOÁN
        const invoice = await Invoice.create({
            invoice_number: `INV-SEPAY-${Date.now()}`,
            table_id: table._id,
            order_ids: orderIds,
            total_amount: billingAmount,
            status: 'paid',
            payment_method: 'sepay'
        });

        await Payment.create({
            invoice_id: invoice._id,
            method: 'sepay',
            amount_paid: Number(transferAmount),
            status: 'success',
            transaction_id: `SEPAY-${Date.now()}`,
            note: content
        });

        // 3. ÉP TRẠNG THÁI ĐỂ ẨN MÓN NGAY LẬP TỨC
        // Dùng Promise.all để chạy song song 2 lệnh update cho lẹ
        await Promise.all([
            Order.updateMany(
                { _id: { $in: orderIds } },
                { $set: { status: 'completed' } }
            ),
            OrderItem.updateMany(
                { order_id: { $in: orderIds }, status: { $ne: 'canceled' } },
                { $set: { status: 'served' } }
            )
        ]);

        await Table.findByIdAndUpdate(table._id, { status: 'available' });

        // 4. BẮN SOCKET
        const io = getIO();
        if (io) {
            io.emit('payment_success', { tableId: String(table.table_number) });
        }

        return res.status(200).send("OK"); // Trả về OK để SePay báo xanh
    } catch (error) {
        // NẾU CÓ LỖI, IN RA LOG ĐỂ MÌNH ĐỌC
        console.error("🔥 LỖI CRASH WEBHOOK:", error);
        return res.status(200).send("Error");
    }
};
