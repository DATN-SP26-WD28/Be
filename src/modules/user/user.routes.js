import express from 'express';
import { getAllUsers, getMe, getMyOrders, toggleUserStatus, updateMe } from './user.controller.js';
import { protect } from '../../shared/middlewares/auth.middleware.js';


const userRouter = express.Router();

userRouter.use(protect);

userRouter.get("/me", getMe);             // Xem hồ sơ cá nhân
userRouter.patch("/update-me", updateMe); // Chỉnh sửa hồ sơ cá nhân
userRouter.get("/my-orders", getMyOrders); // Xem lịch sử đơn hàng

// --- CHỈ ADMIN MỚI ĐƯỢC VÀO ---

userRouter.get("/", getAllUsers);         // Lấy danh sách tất cả User
userRouter.patch("/lock-user/:id", toggleUserStatus);  // khoá người dùng

export default userRouter;