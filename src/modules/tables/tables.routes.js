import express from 'express';
import { checkInTable, createTable, getAllTables, updateTable, deleteTable, regenerateToken } from './tables.controller.js';
// Giả sử bạn đã có middleware verifyToken và checkRole
// import { verifyToken, isAdmin } from '../../shared/middlewares/auth.js';

const tablesRouter = express.Router();

// Public: Khách quét QR
tablesRouter.get('/check-in/:table_number', checkInTable);

// Private: Admin quản lý
tablesRouter.post('/', createTable); 
tablesRouter.get('/', getAllTables); 
tablesRouter.put('/:id', updateTable);
tablesRouter.patch('/:id/regenerate-token', regenerateToken);
tablesRouter.delete('/:id', deleteTable);

export default tablesRouter;