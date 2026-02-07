import express from 'express';
import { checkInTable, createTable, getAllTables } from './tables.controller.js';
// Giả sử bạn đã có middleware verifyToken và checkRole
// import { verifyToken, isAdmin } from '../../shared/middlewares/auth.js';

const tablesRouter = express.Router();



// Private: Admin quản lý
tablesRouter.post('/', createTable); 

export default tablesRouter;