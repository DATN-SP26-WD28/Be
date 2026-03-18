import express from 'express';
import { createPaymentUrl, getPaymentByInvoice, paymentCallback, processPayment, vnpayIPN } from './payments.controller.js';


const paymentRouter = express.Router();

// --- THANH TOÁN THỦ CÔNG (TẠI QUẦY) ---
// POST: http://localhost:1904/api/payments/process
paymentRouter.post('/process', processPayment);

// --- THANH TOÁN ONLINE (VNPAY SANDBOX) ---
// 1. Tạo link thanh toán để gửi sang VNPay
// POST: http://localhost:1904/api/payments/create-url
paymentRouter.post('/create-url', createPaymentUrl);

// 2. Nhận phản hồi sau khi khách thanh toán xong (Dùng để Redirect)
// GET: http://localhost:1904/api/payments/vnpay-callback
paymentRouter.get('/vnpay-callback', paymentCallback);

// 3. Nhận thông báo từ VNPay Server (Dùng để cập nhật DB an toàn)
// GET: http://localhost:1904/api/payments/vnpay-ipn
paymentRouter.get('/vnpay-ipn', vnpayIPN);

// --- TRUY VẤN DỮ LIỆU ---
// GET: http://localhost:1904/api/payments/invoice/:invoiceId
paymentRouter.get('/invoice/:invoiceId', getPaymentByInvoice);

export default paymentRouter;