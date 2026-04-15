import express from 'express';
import { protect, restrictTo } from '../../shared/middlewares/auth.middleware.js';
import { createPaymentUrl, handleSepayWebhook, processCounterPayment } from './payments.controller.js';


const paymentRouter = express.Router();

// 1. Dành cho Khách tự thanh toán Online tại bàn
paymentRouter.post('/create-url', createPaymentUrl);
// paymentRouter.get('/vnpay-return', vnpayReturn);
// paymentRouter.get('/vnpay-ipn', vnpayIPN);

// 2. Dành cho Nhân viên thanh toán tại quầy (Tiền mặt/Banking trực tiếp)
paymentRouter.post('/process',
    protect,
    restrictTo('admin', 'staff'),
    processCounterPayment);

paymentRouter.post('/sepay-webhook', handleSepayWebhook);

export default paymentRouter;