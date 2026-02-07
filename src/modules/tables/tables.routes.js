import express from 'express';
import { checkInTable, createTable, getAllTables } from './tables.controller.js';
// Giả sử bạn đã có middleware verifyToken và checkRole
// import { verifyToken, isAdmin } from '../../shared/middlewares/auth.js';

const tablesRouter = express.Router();

// Public: Khách quét QR
tablesRouter.get('/check-in/:table_number', checkInTable);

// Private: Admin quản lý
tablesRouter.post('/', createTable); 
tablesRouter.get('/', getAllTables); 

export default tablesRouter;