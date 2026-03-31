import express from 'express';
import { 
  getAllStaff, 
  getStaffById, 
  createStaff, 
  updateStaff, 
  deleteStaff, 
  toggleStaffStatus,
  getStaffByRole 
} from './staff.controller.js';

const staffRouter = express.Router();

// PUBLIC ROUTES - CRUD Operations
staffRouter.get("/", getAllStaff); // Lấy tất cả nhân viên
staffRouter.get("/role/:role", getStaffByRole); // Lấy nhân viên theo role
staffRouter.get("/:id", getStaffById); // Lấy nhân viên theo ID
staffRouter.post("/", createStaff); // Tạo nhân viên mới
staffRouter.put("/:id", updateStaff); // Cập nhật nhân viên
staffRouter.delete("/:id", deleteStaff); // Xóa nhân viên
staffRouter.patch("/:id/toggle-status", toggleStaffStatus); // Khóa/Mở khóa nhân viên

export default staffRouter;
