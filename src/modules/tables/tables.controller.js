import createError from '../../shared/utils/createError.js';
import createResponse from '../../shared/utils/createResponse.js';
import handleAsync from '../../shared/utils/handleAsync.js';
import Table from './tables.model.js';


// --- DÀNH CHO QUẢN LÝ ---

// 1. Tạo bàn mới và tạo mã QR tự động
export const createTable = handleAsync(async (req, res) => {
  const { table_number, capacity } = req.body;
  
  const existingTable = await Table.findOne({ table_number });
  if (existingTable) throw createError(res, 400, 'Số bàn này đã tồn tại');

  // Giả sử link QR dẫn đến Frontend: https://roosta.vn/table/T01
  const qr_code = `${process.env.CLIENT_URL}/table/${table_number}`;

  const newTable = await Table.create({ table_number, capacity, qr_code });
  return createResponse(res, 201, 'Tạo bàn thành công', newTable);
});

