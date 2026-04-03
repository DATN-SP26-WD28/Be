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


function sortObject(obj) {
    let sorted = {};
    let str = Object.keys(obj).map(key => encodeURIComponent(key)).sort();
    for (let key of str) {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    }
    return sorted;
}

// ==========================================
// 1. TẠO LINK THANH TOÁN (Khách bấm từ Mobile)
// ==========================================
export const createPaymentUrl = async (req, res) => {
    try {
        const { table_id, amount, bankCode } = req.body;
        // Lưu ý: table_id ở đây đang nhận vào là table_number (ví dụ: "1")

        // BƯỚC 0: Tìm bàn thực sự trong DB bằng số bàn
        const table = await Table.findOne({ table_number: table_id });
        if (!table) {
            return res.status(404).json({ message: "Không tìm thấy thông tin bàn này" });
        }

        // BƯỚC A: Tìm đơn hàng bằng _id thật của bàn
        const activeOrders = await Order.find({
            table_id: table._id,
            status: { $ne: 'completed' }
        });

        if (!activeOrders.length) {
            return res.status(400).json({ message: "Bàn này không có đơn hàng nào cần thanh toán" });
        }

        const invoice = await Invoice.create({
            invoice_number: `INV${moment().format('YYYYMMDDHHmmss')}`,
            table_id: table._id, // Dùng ID thật
            order_ids: activeOrders.map(o => o._id),
            total_amount: amount,
            status: 'unpaid',
            payment_method: 'vnpay'
        });

        // BƯỚC B: Cấu hình VNPay
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
            'vnp_OrderInfo': `Thanh toan hoa don Roosta - Ban ${table.table_number}`,
            'vnp_OrderType': 'other',
            'vnp_Amount': amount * 100,
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

        return res.status(200).json({ paymentUrl: finalUrl });
    } catch (error) {
        console.error("DEBUG LỖI VNPAY:", error);
        return res.status(500).json({ message: "Lỗi hệ thống khi tạo link", detail: error.message });
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
    const { table_id, method, amount_paid, note, split_count } = req.body;

    // Tìm bàn bằng table_number
    const table = await Table.findOne({ table_number: table_id });
    if (!table) return next(createError(res, 404, "Không tìm thấy bàn"));

    const activeOrders = await Order.find({
        table_id: table._id,
        status: { $ne: 'completed' }
    });

    if (!activeOrders.length) return next(createError(res, 404, "Bàn này không có đơn cần trả tiền"));

    const totalAmount = activeOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    const invoice = await Invoice.create({
        invoice_number: `INV-POS-${Date.now()}`,
        table_id: table._id,
        order_ids: activeOrders.map(o => o._id),
        total_amount: totalAmount,
        status: 'paid',
        payment_method: method || 'cash',
        split_count: split_count || 1
    });

    await Payment.create({
        invoice_id: invoice._id,
        method: method || 'cash',
        amount_paid: amount_paid || totalAmount,
        status: 'success',
        transaction_id: `OFFLINE-${Date.now()}`,
        note: note || `Nhân viên chốt đơn tại quầy`
    });

    await Order.updateMany({ _id: { $in: invoice.order_ids } }, { $set: { status: 'completed' } });
    await Table.findByIdAndUpdate(table._id, { status: 'available' });

    return createResponse(res, 201, "Thanh toán thành công. Bàn đã trống!", invoice);
});