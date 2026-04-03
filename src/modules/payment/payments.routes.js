import express from 'express';
import { createPaymentUrl, processCounterPayment, vnpayIPN, vnpayReturn } from './payments.controller.js';
import { protect, restrictTo } from '../../shared/middlewares/auth.middleware.js';


const paymentRouter = express.Router();

// 1. Dành cho Khách tự thanh toán Online tại bàn
paymentRouter.post('/create-url', createPaymentUrl); // Tạo link VNPay
paymentRouter.get('/vnpay-return', vnpayReturn);      // Trả kết quả về giao diện khách
paymentRouter.get('/vnpay-ipn', vnpayIPN);            // Cập nhật DB ngầm (An toàn nhất)

// 2. Dành cho Nhân viên thanh toán tại quầy (Tiền mặt/Banking trực tiếp)
paymentRouter.post('/process',
    protect,
    restrictTo('admin', 'staff'),
    processCounterPayment);

export default paymentRouter;