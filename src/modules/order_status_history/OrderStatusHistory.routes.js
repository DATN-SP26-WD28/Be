import express from 'express';
import { getOrderHistory, updateOrderStatus } from './OrderStatusHistory.controller.js';

const OrderStatusHistoryRouter = express.Router();

OrderStatusHistoryRouter.post('/update', updateOrderStatus);
OrderStatusHistoryRouter.get('/:orderId', getOrderHistory);

export default OrderStatusHistoryRouter;