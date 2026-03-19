import express from 'express';
import { getAllUsers, getMe, getMyOrders, toggleUserStatus, updateMe } from './user.controller.js';
import { protect } from '../../shared/middlewares/auth.middleware.js';


const userRouter = express.Router();

userRouter.use(protect);

userRouter.get("/me", getMe);
userRouter.patch("/update-me", updateMe);
userRouter.get("/my-orders", getMyOrders);
// --- CHỈ ADMIN MỚI ĐƯỢC VÀO ---

userRouter.get("/", getAllUsers);
userRouter.patch("/lock-user/:id", toggleUserStatus);

export default userRouter;