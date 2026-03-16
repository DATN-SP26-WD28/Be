import OrderItemStatusHistory from './OrderItemStatusHistory.model.js';
import { OrderItem } from '../order_items/order_items.model.js';
import handleAsync from '../../shared/utils/handleAsync.js';
import createError from '../../shared/utils/createError.js';
import createResponse from '../../shared/utils/createResponse.js';

// 1. Cập nhật trạng thái món ăn và lưu lịch sử
export const updateItemStatus = handleAsync(async (req, res) => {
  const { order_item_id, new_status, changed_by, note } = req.body;

  // Bước 1: Tìm món ăn hiện tại để lấy trạng thái cũ
  const item = await OrderItem.findById(order_item_id);
  if (!item) return createError(res, 404, "Không tìm thấy món ăn trong đơn hàng");

  const old_status = item.status;

  // Bước 2: Cập nhật trạng thái mới cho món ăn đó
  item.status = new_status;
  await item.save();

  // Bước 3: Ghi lại lịch sử thay đổi vào bảng OrderItemStatusHistory
  const history = await OrderItemStatusHistory.create({
    order_item_id,
    old_status,
    new_status,
    changed_by,
    note
  });

  return createResponse(res, 200, `Đã chuyển trạng thái sang: ${new_status}`, history);
});

// 2. Xem lịch sử thay đổi của một món ăn cụ thể
export const getItemHistory = handleAsync(async (req, res) => {
  const { itemId } = req.params;

  const history = await OrderItemStatusHistory.find({ order_item_id: itemId })
    .populate('changed_by', 'username role') // Biết ai là người đổi
    .sort({ created_at: -1 }); // Mới nhất lên đầu

  return createResponse(res, 200, "Lấy lịch sử món ăn thành công", history);
});