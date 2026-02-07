import express from 'express';
import { createTable, getAllTables } from './tables.controller.js';
// Giả sử bạn đã có middleware verifyToken và checkRole
// import { verifyToken, isAdmin } from '../../shared/middlewares/auth.js';

const tablesRouter = express.Router();



// Private: Admin quản lý
tablesRouter.post('/', createTable); 
tablesRouter.get('/', getAllTables); 

export default tablesRouter;