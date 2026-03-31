import createError from "../../shared/utils/createError.js";
import createResponse from "../../shared/utils/createResponse.js";
import handleAsync from "../../shared/utils/handleAsync.js";
import { Order } from "../orders/orders.model.js";
import OrderStatusHistory from "./OrderStatusHistory.model.js";


// 1. Cập nhật trạng thái tổng của Đơn hàng
export const updateOrderStatus = handleAsync(async (req, res) => {
  const { order_id, new_status, changed_by, note } = req.body;

  const order = await Order.findById(order_id);
  if (!order) return createError(res, 404, "Không tìm thấy đơn hàng");

  const old_status = order.status;

  // Cập nhật trạng thái đơn hàng chính
  order.status = new_status;
  await order.save();

  // Ghi lịch sử
  const history = await OrderStatusHistory.create({
    order_id,
    old_status,
    new_status,
    changed_by,
    note
  });

  return createResponse(res, 200, `Đơn hàng đã chuyển sang: ${new_status}`, history);
});

// 2. Lấy lịch sử của một Đơn hàng
export const getOrderHistory = handleAsync(async (req, res) => {
  const { orderId } = req.params;

  const history = await OrderStatusHistory.find({ order_id: orderId })
    .populate('changed_by', 'username role')
    .sort({ changed_at: -1 });

  return createResponse(res, 200, "Lấy lịch sử đơn hàng thành công", history);
});