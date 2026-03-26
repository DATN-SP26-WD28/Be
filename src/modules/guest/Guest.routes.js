import express from 'express';
import { protect } from '../../shared/middlewares/auth.middleware.js';
import { guestController } from './Guest.controller.js';

const guestRouter = express.Router();

// Public: Khách vào bàn nhập tên
guestRouter.post('/login', guestController.login);

// Private: Cần token để xem thông tin cá nhân hoặc gọi món
guestRouter.use(protect);

guestRouter.get('/me', guestController.getMe);
guestRouter.delete('/logout', guestController.logout);

export default guestRouter;