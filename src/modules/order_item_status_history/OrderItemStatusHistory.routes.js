import express from 'express';
import { getItemHistory, updateItemStatus } from './OrderItemStatusHistory.controller.js';

const orderItemStatusHistoryRouter = express.Router();

// API dành cho Bếp/Phục vụ cập nhật trạng thái món
// POST: http://localhost:1904/order-item-history/update
orderItemStatusHistoryRouter.post('/update', updateItemStatus);

// API xem lịch sử biến động của 1 món ăn lẻ
// GET: http://localhost:1904/order-item-history/item/:itemId
orderItemStatusHistoryRouter.get('/item/:itemId', getItemHistory);

export default orderItemStatusHistoryRouter;