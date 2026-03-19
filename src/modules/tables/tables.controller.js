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
  const qr_code = `${process.env.CLIENT_URL || 'http://localhost:5173'}/table/${table_number}`;

  const newTable = await Table.create({ table_number, capacity, qr_code });
  return createResponse(res, 201, 'Tạo bàn thành công', newTable);
});

// 2. Lấy danh sách tất cả bàn (để Admin quản lý)
export const getAllTables = handleAsync(async (req, res) => {
  const tables = await Table.find().sort({ table_number: 1 });
  return createResponse(res, 200, 'Lấy danh sách bàn thành công', tables);
});

// --- DÀNH CHO NGƯỜI DÙNG ---

// 3. Khách quét mã QR (Check-in)
export const checkInTable = handleAsync(async (req, res) => {
  const { table_number } = req.params;

  const table = await Table.findOne({ table_number });
  if (!table) throw createError(res, 404, 'Không tìm thấy bàn');

  if (table.status === 'occupied') {
    return createResponse(res, 200, 'Bàn đang được sử dụng, bạn có muốn tham gia nhóm đặt món không?', table);
  }

  // Cập nhật trạng thái bàn sang đang sử dụng
  table.status = 'occupied';
  await table.save();

  return createResponse(res, 200, 'Check-in thành công. Chào mừng quý khách!', table);
});

// 4. Cập nhật thông tin bàn
export const updateTable = handleAsync(async (req, res) => {
  const { id } = req.params;
  const { table_number, capacity, status, location } = req.body;

  const table = await Table.findById(id);
  if (!table) throw createError(res, 404, 'Không tìm thấy bàn');

  if (table_number && table_number !== table.table_number) {
    const existingTable = await Table.findOne({ table_number });
    if (existingTable) throw createError(res, 400, 'Số bàn này đã tồn tại');
    
    // Cập nhật QR code nếu số bàn thay đổi
    table.qr_code = `${process.env.CLIENT_URL || 'http://localhost:5173'}/table/${table_number}`;
  }

  table.table_number = table_number || table.table_number;
  table.capacity = capacity || table.capacity;
  table.status = status || table.status;
  table.location = location || table.location;

  await table.save();
  return createResponse(res, 200, 'Cập nhật bàn thành công', table);
});

// 5. Xóa bàn
export const deleteTable = handleAsync(async (req, res) => {
  const { id } = req.params;
  const table = await Table.findByIdAndDelete(id);
  if (!table) throw createError(res, 404, 'Không tìm thấy bàn');
  return createResponse(res, 200, 'Xóa bàn thành công');
});
