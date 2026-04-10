import OrderItemStatusHistory from './OrderItemStatusHistory.model.js';
import { OrderItem } from '../order_items/order_items.model.js';
import handleAsync from '../../shared/utils/handleAsync.js';
import createError from '../../shared/utils/createError.js';
import createResponse from '../../shared/utils/createResponse.js';
import { Order } from '../orders/orders.model.js';
import { getIO } from '../../shared/utils/socket.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../shared/constants/socket.constants.js';

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

  const order = await Order.findById(item.order_id).populate('table_id', 'table_number');
  const tableId = order?.table_id?._id?.toString() || order?.table_id?.toString();
  const tableNumber = order?.table_id?.table_number?.toString();
  const io = getIO();

  if (io) {
    const payload = {
      itemId: item?._id?.toString(),
      orderId: item?.order_id?.toString(),
      tableId,
      tableNumber,
      oldStatus: old_status,
      newStatus: new_status,
      updatedAt: history?.createdAt || new Date().toISOString(),
    };

    io.to(SOCKET_ROOMS.ADMIN_ORDERS).emit(SOCKET_EVENTS.ORDER_ITEM_STATUS_UPDATED, payload);
    if (payload.orderId) {
      io.to(SOCKET_ROOMS.order(payload.orderId)).emit(SOCKET_EVENTS.ORDER_ITEM_STATUS_UPDATED, payload);
    }
    if (tableId) {
      io.to(SOCKET_ROOMS.table(tableId)).emit(SOCKET_EVENTS.ORDER_ITEM_STATUS_UPDATED, payload);
    }
    if (tableNumber) {
      io.to(SOCKET_ROOMS.table(tableNumber)).emit(SOCKET_EVENTS.ORDER_ITEM_STATUS_UPDATED, payload);
    }
  }

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