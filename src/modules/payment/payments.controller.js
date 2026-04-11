import moment from 'moment';
import qs from 'qs';
import crypto from 'crypto';
import { Order } from '../orders/orders.model.js';
import Invoice from '../invoice/Invoice.model.js';
import Table from '../tables/tables.model.js';
import handleAsync from '../../shared/utils/handleAsync.js';
import { vnpayConfig } from '../../shared/configs/vnpay.configs.js';
import Payment from './payments.model.js';
import createError from '../../shared/utils/createError.js';
import createResponse from '../../shared/utils/createResponse.js';
import { OrderItem } from '../order_items/order_items.model.js';
import { getIO } from '../../shared/utils/socket.js';


function sortObject(obj) {
    let sorted = {};
    let str = Object.keys(obj).map(key => encodeURIComponent(key)).sort();
    for (let key of str) {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    }
    return sorted;
}

// Hàm helper tính tổng tiền chỉ cho món 'served'
const calculateServedAmount = async (orderIds) => {
    const items = await OrderItem.find({
        order_id: { $in: orderIds },
        status: { $in: ['served', 'Đã phục vụ'] }
    });
    return items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
};

// ==========================================
// 1. TẠO LINK THANH TOÁN (Khách bấm từ Mobile)
// ==========================================
export const createPaymentUrl = async (req, res) => {
    try {
        const { table_id, bankCode } = req.body; // Bỏ amount từ body để BE tự tính cho chuẩn

        const table = await Table.findOne({ table_number: table_id });
        if (!table) return res.status(404).json({ message: "Không tìm thấy bàn" });

        const activeOrders = await Order.find({
            table_id: table._id,
            status: { $nin: ['completed', 'cancelled'] }
        });

        if (!activeOrders.length) return res.status(400).json({ message: "Bàn trống" });

        const orderIds = activeOrders.map(o => o._id);

        // --- LOGIC MỚI: TỰ TÍNH TIỀN DỰA TRÊN MÓN ĐÃ PHỤ VỤ ---
        const amount = await calculateServedAmount(orderIds);

        if (amount <= 0) {
            return res.status(400).json({ message: "Chưa có món nào được phục vụ để thanh toán" });
        }

        const invoice = await Invoice.create({
            invoice_number: `INV${moment().format('YYYYMMDDHHmmss')}`,
            table_id: table._id,
            order_ids: orderIds,
            total_amount: amount,
            status: 'unpaid',
            payment_method: 'vnpay'
        });

        // Cấu hình VNPay (Giữ nguyên phần hash cũ của Khanh)
        let date = new Date();
        let createDate = moment(date).format('YYYYMMDDHHmmss');
        let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "127.0.0.1";

        let vnp_Params = {
            'vnp_Version': '2.1.0',
            'vnp_Command': 'pay',
            'vnp_TmnCode': vnpayConfig.vnp_TmnCode,
            'vnp_Locale': 'vn',
            'vnp_CurrCode': 'VND',
            'vnp_TxnRef': invoice._id.toString(),
            'vnp_OrderInfo': `Thanh toan Roosta - Ban ${table.table_number}`,
            'vnp_OrderType': 'other',
            'vnp_Amount': amount * 100, // Tiền đã tính lại
            'vnp_ReturnUrl': vnpayConfig.vnp_ReturnUrl,
            'vnp_IpAddr': ipAddr,
            'vnp_CreateDate': createDate
        };

        if (bankCode) vnp_Params['vnp_BankCode'] = bankCode;
        vnp_Params = sortObject(vnp_Params);
        let signData = qs.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
        let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;

        const finalUrl = vnpayConfig.vnp_Url + '?' + qs.stringify(vnp_Params, { encode: false });
        return res.status(200).json({ paymentUrl: finalUrl, amount });
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống", detail: error.message });
    }
};
// ==========================================
// 2. XỬ LÝ KẾT QUẢ (Dọn bàn & Lưu lịch sử)
// ==========================================
export const vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const invoiceId = vnp_Params['vnp_TxnRef'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        // Sắp xếp và tạo chữ ký kiểm tra
        vnp_Params = sortObject(vnp_Params);
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        // 1. KIỂM TRA CHỮ KÝ BẢO MẬT
        if (secureHash !== signed) {
            console.error("❌ Sai chữ ký bảo mật từ VNPay!");
            return res.status(400).send("Sai chữ ký bảo mật");
        }

        // 2. KIỂM TRA MÃ PHẢN HỒI (00 = Thành công)
        if (responseCode === '00') {
            console.log(`✅ Thanh toán thành công hóa đơn: ${invoiceId}`);

            // Tìm Invoice để lấy thông tin table_id và order_ids
            const invoice = await Invoice.findById(invoiceId);

            if (!invoice) {
                console.error("❌ Không tìm thấy Invoice trong DB!");
                return res.redirect(`http://localhost:5173/payment-failed?reason=invoice_not_found`);
            }

            // Nếu hóa đơn đã được thanh toán rồi (do IPN xử lý trước) thì chỉ việc redirect
            if (invoice.status === 'paid') {
                console.log("ℹ️ Hóa đơn đã được xử lý từ trước (IPN).");
                return res.redirect(`http://localhost:5173/payment-result?vnp_ResponseCode=00&invoice=${invoiceId}`);
            }

            // --- BẮT ĐẦU CẬP NHẬT DATABASE ---

            // A. Cập nhật Invoice
            invoice.status = 'paid';
            await invoice.save();

            // B. Tạo bản ghi Payment để lưu lịch sử (Dùng Payment model)
            await Payment.create({
                invoice_id: invoiceId,
                method: 'vnpay',
                amount_paid: Number(vnp_Params['vnp_Amount']) / 100,
                transaction_id: vnp_Params['vnp_TransactionNo'],
                status: 'success',
                note: 'Khách tự thanh toán qua VNPay'
            });

            // C. Đóng tất cả Order lẻ (Chuyển sang completed)
            const orderUpdate = await Order.updateMany(
                { _id: { $in: invoice.order_ids } },
                { $set: { status: 'completed' } }
            );
            console.log(`✅ Đã đóng ${orderUpdate.modifiedCount} đơn hàng.`);

            // D. Giải phóng bàn (Từ occupied sang available)
            await Table.findByIdAndUpdate(invoice.table_id, {
                status: 'available'
            });
            console.log(`✅ Đã giải phóng bàn ID: ${invoice.table_id}`);

            // Chuyển hướng về trang thành công kèm thông tin
            return res.redirect(`http://localhost:5173/payment-result?vnp_ResponseCode=00&vnp_TransactionNo=${vnp_Params['vnp_TransactionNo']}&vnp_Amount=${vnp_Params['vnp_Amount']}`);
        } else {
            // Thanh toán thất bại hoặc khách hủy
            console.warn(`⚠️ Giao dịch thất bại với mã: ${responseCode}`);
            return res.redirect(`http://localhost:5173/payment-result?vnp_ResponseCode=${responseCode}`);
        }

    } catch (error) {
        console.error("❌ LỖI CRASH VNPAY_RETURN:", error);
        return res.status(500).send("Lỗi hệ thống khi xử lý kết quả thanh toán");
    }
};

export const vnpayIPN = handleAsync(async (req, res) => {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const invoiceId = vnp_Params['vnp_TxnRef'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash === signed) {
        // 1. Kiểm tra hóa đơn trong DB
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(200).json({ RspCode: '01', Message: 'Order not found' });

        // 2. Nếu đã thanh toán rồi thì không xử lý lại (tránh trùng lặp)
        if (invoice.status === 'paid') return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });

        if (responseCode === '00') {
            // THANH TOÁN THÀNH CÔNG: Thực hiện bộ 3 dọn dẹp
            invoice.status = 'paid';
            await invoice.save();

            // Tạo bản ghi Payment
            await Payment.create({
                invoice_id: invoiceId,
                method: 'vnpay',
                amount_paid: vnp_Params['vnp_Amount'] / 100,
                transaction_id: vnp_Params['vnp_TransactionNo'],
                status: 'success'
            });

            // Chuyển Order sang completed & Mở bàn
            await Order.updateMany({ _id: { $in: invoice.order_ids } }, { $set: { status: 'completed' } });
            await Table.findByIdAndUpdate(invoice.table_id, { status: 'available' });

            return res.status(200).json({ RspCode: '00', Message: 'Success' });
        } else {
            return res.status(200).json({ RspCode: '00', Message: 'Payment failed' });
        }
    }
    res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
});

export const processCounterPayment = handleAsync(async (req, res) => {
    const { table_id, method, note, split_count } = req.body;

    const table = await Table.findOne({ table_number: table_id });
    if (!table) return res.status(404).json({ message: "Không tìm thấy bàn" });

    const activeOrders = await Order.find({
        table_id: table._id,
        status: { $nin: ['completed', 'cancelled'] }
    });

    if (!activeOrders.length) return res.status(404).json({ message: "Bàn không có đơn hàng" });

    const orderIds = activeOrders.map(o => o._id);

    // --- LOGIC MỚI: CHỈ TÍNH TIỀN MÓN ĐÃ PHỤ VỤ ---
    const finalAmount = await calculateServedAmount(orderIds);

    if (finalAmount <= 0) {
        return res.status(400).json({ message: "Bàn này chưa có món nào hoàn thành phục vụ" });
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
        note: note || `Thanh toán món đã phục vụ tại quầy`
    });

    // Cập nhật các Order: 
    // Lưu ý: Nếu có món chưa phục vụ, bạn có thể cân nhắc giữ lại Order hoặc đóng tất cả tùy nghiệp vụ.
    // Ở đây mình đóng tất cả theo luồng cũ của bạn để giải phóng bàn.
    await Order.updateMany({ _id: { $in: orderIds } }, { $set: { status: 'completed' } });
    await Table.findByIdAndUpdate(table._id, { status: 'available' });

    return createResponse(res, 201, "Thanh toán thành công!", invoice);
});




export const handleSepayWebhook = async (req, res) => {
    try {
        console.log("=== 🚀 NHẬN WEBHOOK SEPAY: XỬ LÝ NHƯ POS TẠI QUẦY ===");

        const { transferAmount, content, transferType } = req.body;

        if (transferType !== 'in') return res.status(200).json({ success: true });

        // 1. Rút trích mã 6 ký tự cuối ID đơn hàng
        const match = content.match(/ROOSTA([A-Z0-9]+)/i);
        if (!match) {
            console.log("-> ❌ Nội dung không chứa mã ROOSTA");
            return res.status(200).json({ success: true });
        }

        const orderShortCode = match[1];

        // 2. Tìm một đơn hàng làm "gốc" để xác định bàn (table_id)
        const leadOrder = await Order.findOne({
            $expr: {
                $eq: [
                    { $toLower: { $substr: [{ $toString: "$_id" }, 18, 6] } },
                    orderShortCode.toLowerCase()
                ]
            },
            status: { $nin: ['completed', 'cancelled'] }
        });

        if (!leadOrder) {
            console.log("-> ❌ Không tìm thấy đơn hàng khớp mã hoặc đơn đã đóng.");
            return res.status(200).json({ success: true });
        }

        // 3. Tìm tất cả các đơn hàng chưa hoàn thành của cái bàn đó (Y hệt hàm POS của bạn)
        const activeOrders = await Order.find({
            table_id: leadOrder.table_id,
            status: { $nin: ['completed', 'cancelled'] }
        });

        const orderIds = activeOrders.map(o => o._id);

        // 4. LOGIC TÍNH TIỀN MÓN ĐÃ PHỤC VỤ (Dùng hàm calculateServedAmount bạn đã có)
        // Lưu ý: Đảm bảo hàm calculateServedAmount đã được import vào file này
        const finalAmount = await calculateServedAmount(orderIds);

        if (finalAmount <= 0) {
            console.log("-> ❌ Bàn có đơn nhưng chưa có món nào hoàn thành phục vụ.");
            return res.status(200).json({ success: true });
        }

        // --- BẮT ĐẦU LƯU DỮ LIỆU VÀO DB (Copy logic từ POS) ---

        // 5. Tạo Hóa đơn (Invoice)
        const invoice = await Invoice.create({
            invoice_number: `INV-SEPAY-${Date.now()}`,
            table_id: leadOrder.table_id,
            order_ids: orderIds,
            total_amount: finalAmount,
            status: 'paid',
            payment_method: 'sepay', // Đánh dấu là SePay để dễ phân loại
            split_count: 1
        });

        // 6. Tạo Giao dịch (Payment)
        await Payment.create({
            invoice_id: invoice._id,
            method: 'sepay',
            amount_paid: Number(transferAmount), // Số tiền thực tế khách quét
            status: 'success',
            transaction_id: `SEPAY-${Date.now()}`,
            note: `Thanh toán tự động qua SePay (VietQR)`
        });

        // 7. Cập nhật trạng thái các Order và giải phóng bàn
        await Order.updateMany({ _id: { $in: orderIds } }, { $set: { status: 'completed' } });
        await Table.findByIdAndUpdate(leadOrder.table_id, { status: 'available' });

        console.log(`-> ✅ Thanh toán thành công bàn ${leadOrder.table_id}. Đã giải phóng bàn.`);

        // 8. Bắn Socket báo cho Frontend (OrdersPage.jsx) để tự tắt Modal QR
        const io = getIO();
        if (io) {
            io.emit('payment_success', {
                tableId: leadOrder.table_id,
                message: "Thanh toán thành công qua VietQR!"
            });
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("🔥 LỖI WEBHOOK SEPAY:", error);
        return res.status(200).json({ success: false });
    }
}