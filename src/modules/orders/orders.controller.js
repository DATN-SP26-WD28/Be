import { Order } from './orders.model.js';
import { OrderItem } from '../order_items/order_items.model.js'
import handleAsync from '../../shared/utils/handleAsync.js';
import createError from '../../shared/utils/createError.js';
import createResponse from '../../shared/utils/createResponse.js';

// 1. Tạo đơn hàng mới (Dành cho Guest/Customer)
export const createOrder = handleAsync(async (req, res) => {
  const { items, note } = req.body; // Không cần lấy total_amount từ body nữa
  const { id, table_id, role } = req.user;

  // 1. Tính toán tổng tiền thực tế từ danh sách món ăn
  const calculatedTotal = items.reduce((sum, item) => {
    return sum + (Number(item.price) * Number(item.quantity));
  }, 0);

  // 2. Tạo đơn hàng tổng (Bảng Orders)
  const newOrder = await Order.create({
    table_id: table_id,
    guest_id: role === 'guest' ? id : null,
    user_id: role === 'customer' ? id : null,
    total_amount: calculatedTotal, // Tự gán giá trị đã tính
    subTotal: calculatedTotal,     // Thêm cả subTotal nếu Schema yêu cầu
    status: 'pending',
    note: note || ""
  });

  // 3. Tạo chi tiết món (Bảng OrderItems)
  const orderItemsData = items.map(item => {
    const itemTotal = item.price * item.quantity;
    return {
      order_id: newOrder._id,
      dish_id: item.dish_id,
      quantity: item.quantity,
      price: item.price,
      total_amount: itemTotal, // Gán cho từng item nếu Schema yêu cầu
      subTotal: itemTotal,      // Gán cho từng item nếu Schema yêu cầu
      status: 'pending'
    };
  });

  await OrderItem.insertMany(orderItemsData);

  return createResponse(res, 201, 'Đặt món thành công!', newOrder);
});
// 2. Lấy danh sách đơn hàng (Admin/Staff quản lý)
export const getAllOrders = handleAsync(async (req, res) => {
  const orders = await Order.find()
    .populate('table_id', 'table_number location')
    .populate('guest_id', 'username')
    .sort({ createdAt: -1 });

  return createResponse(res, 200, 'Lấy danh sách đơn hàng thành công', orders);
});

// 3. Lấy chi tiết một đơn hàng kèm các món ăn
export const getOrder = handleAsync(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('table_id')
    .populate('guest_id');

  if (!order) throw createError(res, 404, 'Không tìm thấy đơn hàng');

  // Lấy thêm danh sách món ăn từ bảng OrderItem
  const items = await OrderItem.find({ order_id: order._id }).populate('dish_id');

  return createResponse(res, 200, 'Lấy chi tiết đơn hàng thành công', { order, items });
});

// 4. Cập nhật trạng thái đơn hàng (Dành cho Admin/Bếp)
export const updateOrder = handleAsync(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!order) throw createError(res, 404, 'Không tìm thấy đơn hàng để cập nhật');

  return createResponse(res, 200, 'Cập nhật trạng thái thành công', order);
});

// 5. Xóa đơn hàng (Thanh toán xong hoặc Hủy)
export const deleteOrder = handleAsync(async (req, res) => {
  const orderId = req.params.id;
  const order = await Order.findByIdAndDelete(orderId);

  if (!order) throw createError(res, 404, 'Không tìm thấy đơn hàng');

  // Xóa luôn các OrderItem liên quan để tránh rác DB
  await OrderItem.deleteMany({ order_id: orderId });

  return createResponse(res, 200, 'Đã xóa đơn hàng và các món ăn liên quan');
});