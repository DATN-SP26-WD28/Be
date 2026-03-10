import express from 'express';
import { addToQueue, assignTableToQueue, cancelQueue, getActiveQueues } from './queues.controller.js';

const queuesRouter = express.Router();

queuesRouter.post('/register', addToQueue); // Khách lấy số
queuesRouter.get('/active', getActiveQueues); // Nhân viên xem danh sách chờ
queuesRouter.post('/assign-table', assignTableToQueue); // Nhân viên gọi khách vào bàn
queuesRouter.patch('/:id/cancel', cancelQueue); // Khách hoặc nhân viên hủy số

export default queuesRouter;