import express from 'express';
import * as orderController from './orders.controller.js';
import { protect, restrictTo } from '../../shared/middlewares/auth.middleware.js';
import validBodyRequest from '../../shared/middlewares/validBodyRequest.js';
import { createOrderByStaffSchema } from './orders.schema.js';
const router = express.Router();

// 1. Khách vãng lai hoặc Thành viên đều có thể đặt món
router.post('/', protect, orderController.createOrder);

// 1b. Admin/Nhân viên tạo đơn cho bàn bất kỳ
router.post(
	'/staff-create',
	protect,
	restrictTo('admin', 'waiter', 'cashier', 'chef'),
	validBodyRequest(createOrderByStaffSchema),
	orderController.createOrderByStaff,
);

// 2. Chỉ Admin hoặc Staff mới có quyền xem tất cả đơn hàng
router.get('/', protect, restrictTo('admin', 'waiter', 'cashier', 'chef'), orderController.getAllOrders);

// 2b. Xem danh sách đơn hàng theo bàn
router.get(
	'/table/:tableId',
	protect,
	restrictTo('admin', 'waiter', 'cashier', 'chef'),
	orderController.getOrdersByTable,
);

// 3. Xem chi tiết 1 đơn hàng (Cần đăng nhập)
router.get('/:id', protect, orderController.getOrder);

// 4. Cập nhật trạng thái đơn hàng (Chỉ Admin/Staff/Bếp)
router.put('/:id', protect, restrictTo('admin', 'waiter', 'cashier', 'chef'), orderController.updateOrder);

// 5. Xóa đơn hàng (Chỉ Admin)
router.delete('/:id', protect, restrictTo('admin'), orderController.deleteOrder);

export default router;