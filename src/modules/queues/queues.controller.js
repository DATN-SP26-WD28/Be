import mongoose from 'mongoose';
import Queue from './queues.model.js';
import Table from '../tables/tables.model.js';
import handleAsync from '../../shared/utils/handleAsync.js';
import createResponse from '../../shared/utils/createResponse.js';
import createError from '../../shared/utils/createError.js';

// 1. Khách hàng đăng ký hàng đợi
export const addToQueue = handleAsync(async (req, res) => {
  const { customer_name, customer_phone, party_size, user_id } = req.body;

  if (!customer_name || !customer_phone || !party_size) {
    return createError(res, 400, "Vui lòng nhập đầy đủ tên, số điện thoại và số người");
  }

  const queueData = {
    customer_name,
    customer_phone,
    party_size: Number(party_size),
  };
  
  // Xử lý ép kiểu user_id bằng async logic
  if (user_id && user_id.trim() !== "") {
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return createError(res, 400, "Định dạng ID người dùng không hợp lệ");
    }
    queueData.user_id = new mongoose.Types.ObjectId(user_id);
  }

  try {
    // Lệnh này sẽ kích hoạt hàm pre('save') async trong model
    const newQueue = await Queue.create(queueData);
    return createResponse(res, 201, 'Đăng ký hàng đợi thành công', newQueue);
  } catch (dbError) {
    console.error("DEBUG DB ERROR:", dbError); 
    // Trả về dbError.message để Postman hiển thị rõ nguyên nhân (ví dụ: lỗi trùng lặp)
    return createError(res, 500, "Lỗi cơ sở dữ liệu", dbError.message);
  }
});

// 2. Lấy danh sách hàng đợi
export const getActiveQueues = handleAsync(async (req, res) => {
  const activeQueues = await Queue.find({ status: 'waiting' }).sort({ createdAt: 1 });
  return createResponse(res, 200, 'Danh sách hàng đợi hiện tại', activeQueues);
});

// 3. Chỉ định bàn (Dẫn khách vào bàn)
export const assignTableToQueue = handleAsync(async (req, res) => {
  const { queue_id, table_id } = req.body;

  try {
    const queue = await Queue.findById(queue_id);
    if (!queue) return createError(res, 404, 'Không tìm thấy thông tin hàng đợi');

    const table = await Table.findById(table_id);
    if (!table || table.status !== 'available') {
      return createError(res, 400, 'Bàn không khả dụng hoặc không tồn tại');
    }

    // Cập nhật trạng thái async
    queue.status = 'seated';
    queue.assigned_table_id = table_id;
    await queue.save();

    table.status = 'occupied';
    await table.save();

    return createResponse(res, 200, 'Đã xếp khách vào bàn thành công', { queue, table });
  } catch (err) {
    return createError(res, 500, "Lỗi xử lý bàn", err.message);
  }
});

// 4. Hủy hàng đợi
export const cancelQueue = handleAsync(async (req, res) => {
  const { id } = req.params;
  try {
    const queue = await Queue.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true });
    if (!queue) return createError(res, 404, 'Không tìm thấy hàng đợi');
    return createResponse(res, 200, 'Đã hủy hàng đợi', queue);
  } catch (err) {
    return createError(res, 500, "Lỗi hủy hàng đợi", err.message);
  }
});