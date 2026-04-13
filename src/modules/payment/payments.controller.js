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

        // 1. Bỏ qua nếu không phải tiền vào
        if (transferType !== 'in') return res.status(200).send("OK");

        console.log("-----------------------------------------");
        console.log("🔔 [SePay Webhook] Nhận biến động số dư:", transferAmount, "VNĐ");
        console.log("📝 Nội dung:", content);

        // 2. Trích xuất mã đơn (ROOSTA + 6 ký tự)
        const match = content.match(/ROOSTA([A-Z0-9]+)/i);
        if (!match) return res.status(200).send("OK");
        const orderShortCode = match[1].toLowerCase();

        // 3. Tìm đơn hàng mồi (Cắt 6 ký tự cuối của _id để so sánh)
        const leadOrder = await Order.findOne({
            $expr: { $eq: [{ $toLower: { $substr: [{ $toString: "$_id" }, 18, 6] } }, orderShortCode] }
        });

        if (!leadOrder) {
            console.log("⚠️ Không tìm thấy đơn hàng chứa mã:", orderShortCode);
            return res.status(200).send("OK");
        }

        // 4. Tìm thông tin Bàn
        const table = await Table.findById(leadOrder.table_id);
        if (!table) return res.status(200).send("OK");

        // 5. Tìm TẤT CẢ đơn hàng đang dở dang của bàn này
        const activeOrders = await Order.find({
            table_id: table._id,
            status: { $nin: ['completed', 'cancelled', 'canceled'] }
        });

        if (!activeOrders.length) {
            console.log("⚠️ Bàn", table.table_number, "không có đơn hàng nào cần đóng.");
            return res.status(200).send("OK");
        }

        const orderIds = activeOrders.map(o => o._id);

        // 6. Tính tiền & Tạo Hóa đơn (Invoice)
        let finalAmount = await calculateServedAmount(orderIds);
        const billingAmount = finalAmount > 0 ? finalAmount : Number(transferAmount);

        const invoice = await Invoice.create({
            invoice_number: `INV-SEPAY-${Date.now()}`,
            table_id: table._id,
            order_ids: orderIds,
            total_amount: billingAmount,
            status: 'paid',
            payment_method: 'sepay'
        });

        // 7. Lưu Lịch sử thanh toán (Payment)
        await Payment.create({
            invoice_id: invoice._id,
            method: 'sepay',
            amount_paid: Number(transferAmount),
            status: 'success',
            transaction_id: `SEPAY-${Date.now()}`,
            note: content
        });

        console.log("✅ Đã lưu thành công Invoice và Payment!");

        // =================================================================
        // 8. DỌN DẸP DỮ LIỆU (BỌC THÉP TỪNG BƯỚC ĐỂ TRÁNH CHẾT CHÙM)
        // =================================================================

        // 8.1. Đóng toàn bộ Order
        try {
            await Order.updateMany(
                { _id: { $in: orderIds } },
                { $set: { status: 'completed' } }
            );
            console.log("✅ Đã đổi trạng thái Order -> completed");
        } catch (e) {
            console.log("❌ Lỗi đổi trạng thái Order:", e.message);
        }

        // 8.2. Đổi trạng thái các món ăn bên trong thành đã phục vụ (Để ẩn món trên FE)
        try {
            await OrderItem.updateMany(
                { order_id: { $in: orderIds }, status: { $ne: 'canceled' } },
                { $set: { status: 'served' } }
            );
            console.log("✅ Đã đổi trạng thái OrderItem -> served");
        } catch (e) {
            console.log("❌ Lỗi đổi trạng thái OrderItem:", e.message);
        }

        // 8.3. Giải phóng bàn
        try {
            await Table.findByIdAndUpdate(table._id, { status: 'available' });
            console.log("✅ Đã giải phóng bàn số:", table.table_number);
        } catch (e) {
            console.log("❌ Lỗi giải phóng Table:", e.message);
        }

        // 8.4. Bắn Socket báo cho Frontend tự động F5/Đóng màn hình
        try {
            const io = getIO();
            if (io) {
                io.emit('payment_success', { tableId: String(table.table_number) });
                console.log("✅ Đã bắn tín hiệu Socket thành công!");
            }
        } catch (e) {
            console.log("❌ Lỗi bắn Socket:", e.message);
        }

        console.log("-----------------------------------------");
        // Luôn trả về 200 OK để SePay biết đã nhận tin, không gọi lại nữa
        return res.status(200).send("OK");

    } catch (error) {
        // Lỗi tổng quát ở những dòng lệnh đầu tiên
        console.error("🔥 LỖI NGHIÊM TRỌNG WEBHOOK SEPAY:", error);
        return res.status(200).send("Error");
    }
};
