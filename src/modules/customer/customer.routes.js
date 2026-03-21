import express from 'express';
import { 
  getAllCustomers, 
  getCustomerById, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer, 
  toggleCustomerStatus,
  addLoyaltyPoints 
} from './customer.controller.js';

const customerRouter = express.Router();

// PUBLIC ROUTES - CRUD Operations
customerRouter.get("/", getAllCustomers); // Lấy tất cả khách hàng
customerRouter.get("/:id", getCustomerById); // Lấy khách hàng theo ID
customerRouter.post("/", createCustomer); // Tạo khách hàng mới
customerRouter.put("/:id", updateCustomer); // Cập nhật khách hàng
customerRouter.delete("/:id", deleteCustomer); // Xóa khách hàng
customerRouter.patch("/:id/toggle-status", toggleCustomerStatus); // Khóa/Mở khóa khách hàng
customerRouter.patch("/:id/add-loyalty-points", addLoyaltyPoints); // Thêm điểm loyalty

export default customerRouter;
