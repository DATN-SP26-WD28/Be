import createError from "../../shared/utils/createError.js";
import createResponse from "../../shared/utils/createResponse.js";
import handleAsync from "../../shared/utils/handleAsync.js";
import Invoice from "../invoice/Invoice.model.js";
import Table from "../tables/tables.model.js";
import paymentService from "./payment.service.js";
import Payment from "./payments.model.js";


// 1. Thanh toán thủ công (Tiền mặt/Tại quầy) - khớp với route /process
export const processPayment = handleAsync(async (req, res) => {
    const { invoice_id, method, amount_paid, transaction_id, note } = req.body;

    const invoice = await Invoice.findById(invoice_id);
    if (!invoice) return createError(res, 404, "Không tìm thấy hóa đơn");

    const payment = await Payment.create({
        invoice_id,
        method,
        amount_paid,
        transaction_id,
        status: 'success',
        note
    });

    invoice.status = 'paid';
    await invoice.save();

    // Giải phóng bàn sau khi trả tiền mặt
    await Table.findByIdAndUpdate(invoice.table_id, { status: 'available' });

    return createResponse(res, 201, "Thanh toán thủ công thành công", payment);
});

// 2. Tạo link thanh toán VNPay
export const createPaymentUrl = handleAsync(async (req, res) => {
    const { invoice_id } = req.body;
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const invoice = await Invoice.findById(invoice_id);
    if (!invoice) return createError(res, 404, "Không tìm thấy hóa đơn");

    const url = await paymentService.generateUrl(invoice_id, invoice.total_amount, ipAddr);

    return createResponse(res, 200, "Tạo link thanh toán thành công", { url });
});

// 3. Callback (Điều hướng người dùng về Frontend)
export const paymentCallback = handleAsync(async (req, res) => {
    const vnp_Params = req.query;
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const invoiceId = vnp_Params['vnp_TxnRef'];

    if (responseCode === '00') {
        // Thành công: Quay về trang success trên React/Vue
        return res.redirect(`http://localhost:5173/payment-success?invoice=${invoiceId}`);
    } else {
        // Thất bại: Quay về trang failed
        return res.redirect('http://localhost:5173/payment-failed');
    }
});

// 4. IPN (Xử lý ngầm Server-to-Server - Đây mới là nơi cập nhật DB an toàn)
export const vnpayIPN = handleAsync(async (req, res) => {
    let vnp_Params = req.query;

    // Giả định kiểm tra Checksum thành công
    const isVerified = true;

    if (isVerified) {
        const invoiceId = vnp_Params['vnp_TxnRef'];
        const responseCode = vnp_Params['vnp_ResponseCode'];

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(200).json({ RspCode: '01', Message: 'Order not found' });

        // Nếu đã thanh toán rồi thì không xử lý lại (tránh trùng lặp)
        if (invoice.status === 'paid') return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });

        if (responseCode === '00') {
            // 1. Tạo bản ghi Payment
            await Payment.create({
                invoice_id: invoiceId,
                method: 'vnpay',
                amount_paid: vnp_Params['vnp_Amount'] / 100,
                transaction_id: vnp_Params['vnp_TransactionNo'],
                status: 'success'
            });

            // 2. Cập nhật Hóa đơn
            invoice.status = 'paid';
            await invoice.save();

            // 3. Giải phóng bàn
            await Table.findByIdAndUpdate(invoice.table_id, { status: 'available' });

            return res.status(200).json({ RspCode: '00', Message: 'Success' });
        }
    }
    res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
});

// 5. Lấy lịch sử thanh toán của hóa đơn
export const getPaymentByInvoice = handleAsync(async (req, res) => {
    const { invoiceId } = req.params;
    const payments = await Payment.find({ invoice_id: invoiceId });

    return createResponse(res, 200, "Lấy dữ liệu thanh toán thành công", payments);
});