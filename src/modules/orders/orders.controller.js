import { Order } from './orders.model.js';
import { OrderItem } from '../order_items/order_items.model.js'
import Dish from '../dishes/dishes.model.js';
import Table from '../tables/tables.model.js';
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

// 1b. Tạo đơn hàng mới (Dành cho Admin/Nhân viên)
export const createOrderByStaff = handleAsync(async (req, res) => {
  const { table_id, items, note } = req.body;
  const { id: staffId } = req.user;

  const table = await Table.findById(table_id);
  if (!table) throw createError(res, 404, 'Không tìm thấy bàn');
  if (table.status === 'out_of_service') {
    throw createError(res, 400, 'Bàn đang ngưng phục vụ, không thể tạo đơn');
  }

  const uniqueDishIds = [...new Set(items.map((item) => item.dish_id))];
  const dishes = await Dish.find({ _id: { $in: uniqueDishIds } }).select('_id price status');
  if (dishes.length !== uniqueDishIds.length) {
    throw createError(res, 400, 'Một số món ăn không tồn tại');
  }

  const dishMap = new Map(dishes.map((dish) => [dish._id.toString(), dish]));

  const normalizedItems = items.map((item) => {
    const dish = dishMap.get(item.dish_id);
    if (!dish) throw createError(res, 400, 'Món ăn không hợp lệ');
    if (dish.status === 'out_of_stock') {
      throw createError(res, 400, 'Có món ăn đang hết hàng, vui lòng kiểm tra lại');
    }

    const quantity = Number(item.quantity);
    const price = Number(dish.price);
    const itemTotal = price * quantity;

    return {
      dish_id: item.dish_id,
      quantity,
      price,
      itemTotal,
    };
  });

  const calculatedTotal = normalizedItems.reduce((sum, item) => sum + item.itemTotal, 0);

  const newOrder = await Order.create({
    table_id,
    guest_id: null,
    user_id: null,
    created_by_staff_id: staffId,
    total_amount: calculatedTotal,
    status: 'pending',
    note: note || '',
  });

  const orderItemsData = normalizedItems.map((item) => ({
    order_id: newOrder._id,
    dish_id: item.dish_id,
    quantity: item.quantity,
    price: item.price,
    total_amount: item.itemTotal,
    subTotal: item.itemTotal,
    status: 'pending',
  }));

  await OrderItem.insertMany(orderItemsData);

  return createResponse(res, 201, 'Tạo đơn hàng thành công!', newOrder);
});
// 2. Lấy danh sách đơn hàng (Admin/Staff quản lý)
export const getAllOrders = handleAsync(async (req, res) => {
  const orders = await Order.find()
    .populate('table_id', 'table_number location')
    .populate('guest_id', 'username')
    .sort({ createdAt: -1 });

  return createResponse(res, 200, 'Lấy danh sách đơn hàng thành công', orders);
});

// 2b. Lấy danh sách đơn hàng theo bàn
export const getOrdersByTable = handleAsync(async (req, res) => {
  // 1. Lấy số bàn từ params (Ví dụ: /table/1)
  const { tableNumber } = req.params;

  // 2. Bước quan trọng: Tìm ID thực sự của bàn dựa trên số bàn
  const table = await Table.findOne({ table_number: Number(tableNumber) });

  if (!table) {
    return createResponse(res, 404, 'Không tìm thấy thông tin bàn này');
  }

  // 3. Tìm tất cả Đơn hàng thuộc về ID của bàn đó
  const orders = await Order.find({ table_id: table._id })
    .populate('table_id', 'table_number location')
    .populate('guest_id', 'username text_color') // Lấy tên khách cho sinh động
    .sort({ createdAt: -1 });

  if (!orders.length) {
    return createResponse(res, 200, 'Bàn hiện tại chưa có đơn hàng nào', []);
  }

  // 4. Lấy chi tiết món ăn cho từng đơn hàng (Giữ nguyên logic cũ của bạn)
  const orderIds = orders.map((order) => order._id);
  const orderItems = await OrderItem.find({ order_id: { $in: orderIds } })
    .populate('dish_id', 'dish_name price image_url');

  const groupedItems = orderItems.reduce((acc, item) => {
    const key = item.order_id?.toString();
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const ordersWithItems = orders.map((order) => {
    const plainOrder = order.toObject();
    plainOrder.items = groupedItems[order._id.toString()] || [];
    // Tính tổng tiền trực tiếp để Frontend không phải tính lại
    plainOrder.total_amount = plainOrder.items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    return plainOrder;
  });

  return createResponse(res, 200, 'Lấy danh sách món đã gọi thành công', ordersWithItems);
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