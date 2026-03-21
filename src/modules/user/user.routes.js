import express from 'express';
import { getAllUsers, getMe, getMyOrders, toggleUserStatus, updateMe, createUser, updateUser, deleteUser, getStaff, getCustomers } from './user.controller.js';
import { protect } from '../../shared/middlewares/auth.middleware.js';


const userRouter = express.Router();

// --- PUBLIC CRUD ROUTES ---
// Lấy danh sách nhân viên (roles: waiter, cashier, chef, admin) - dành cho Staff Management page
userRouter.get("/staff", getStaff);

// Lấy danh sách khách hàng (role: customer) - dành cho Customer Management page
userRouter.get("/customers", getCustomers);

// Lấy tất cả người dùng (deprecated)
userRouter.get("/", getAllUsers);

// Tạo/Cập nhật/Xóa người dùng (CRUD)
userRouter.post("/", createUser);
userRouter.put("/:id", updateUser);
userRouter.delete("/:id", deleteUser);
userRouter.patch("/lock-user/:id", toggleUserStatus);

// --- PROTECTED ROUTES (CẦN ĐĂNG NHẬP) ---
userRouter.use(protect);

userRouter.get("/me", getMe); // Lấy thông tin user đang đăng nhập
userRouter.patch("/update-me", updateMe); // Cập nhật thông tin user đang đăng nhập
userRouter.get("/my-orders", getMyOrders); // Lấy lịch sử đơn hàng của user

export default userRouter;