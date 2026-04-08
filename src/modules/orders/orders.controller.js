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
  const { id: staffId, username } = req.user;
  // 1. Kiểm tra bàn
  const table = await Table.findById(table_id);
  if (!table) throw createError(res, 404, 'Không tìm thấy bàn');
  if (table.status === 'out_of_service') {
    throw createError(res, 400, 'Bàn đang ngưng phục vụ, không thể tạo đơn');
  }

  // 2. Kiểm tra món ăn và tính toán (Giữ nguyên logic của bạn)
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
      throw createError(res, 400, 'Món ăn [' + dish.dish_name + '] đã hết hàng');
    }

    const quantity = Number(item.quantity);
    const price = Number(dish.price);
    return {
      dish_id: item.dish_id,
      quantity,
      price,
      itemTotal: price * quantity,
    };
  });

  const calculatedTotal = normalizedItems.reduce((sum, item) => sum + item.itemTotal, 0);

  // 3. Tạo Đơn hàng
  const newOrder = await Order.create({
    table_id,
    guest_id: null,
    user_id: null,
    created_by_staff_id: staffId,
    total_amount: calculatedTotal,
    status: 'pending',
    note: note || '',
  });

  // 4. Tạo OrderItems (Giữ nguyên logic của bạn)
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

  // --- BƯỚC QUAN TRỌNG: XỬ LÝ DỮ LIỆU TRẢ VỀ ---
  // Chuyển Mongoose document sang Object JS thuần
  const responseData = newOrder.toObject();

  // Thêm tên nhân viên
  responseData.staff_name = username;

  // Loại bỏ các trường không cần thiết
  delete responseData.user_id;
  delete responseData.guest_id;
  delete responseData.__v;

  return createResponse(res, 201, 'Tạo đơn hàng thành công!', responseData);
});

export const getAllOrders = handleAsync(async (req, res) => {
  // 1. Chỉ tìm các đơn hàng đang hoạt động (Chưa hoàn thành, chưa hủy)
  const orders = await Order.find({
    status: { $nin: ['completed', 'canceled'] }
  })
    .populate('table_id', 'table_number location')
    .populate('guest_id', 'username')
    .sort({ createdAt: 1 });

  if (!orders || orders.length === 0) {
    return createResponse(res, 200, 'Hiện không có đơn hàng nào cần xử lý', []);
  }

  const orderIds = orders.map((order) => order._id);

  // 2. Lấy tất cả OrderItems của các đơn hàng này
  const allOrderItems = await OrderItem.find({ order_id: { $in: orderIds } })
    .populate('dish_id', 'dish_name price image_url');

  const groupedItems = allOrderItems.reduce((acc, item) => {
    const key = item.order_id?.toString();
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // 3. Gắn items và TÍNH TOÁN LẠI TỔNG TIỀN (Chỉ tính món đã phục vụ)
  const ordersWithItems = orders.map((order) => {
    const plainOrder = order.toObject();
    const items = groupedItems[order._id.toString()] || [];
    plainOrder.items = items;

    // NGHIỆP VỤ: Chỉ cộng tiền những món có trạng thái 'served'
    plainOrder.total_amount = items.reduce((sum, it) => {
      if (it.status === 'served' || it.status === 'Đã phục vụ') {
        return sum + (Number(it.price) * Number(it.quantity));
      }
      return sum;
    }, 0);

    return plainOrder;
  });

  return createResponse(res, 200, 'Lấy danh sách đơn hàng thành công', ordersWithItems);
});

// 2b. Lấy danh sách đơn hàng theo bàn
export const getOrdersByTable = handleAsync(async (req, res) => {
  const { tableNumber: tableParam } = req.params;
  let query = {};
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(tableParam);

  if (isObjectId) {
    query = { table_id: tableParam };
  } else {
    const tableNum = Number(tableParam);
    const table = await Table.findOne({ table_number: tableNum });
    if (!table) return createResponse(res, 404, 'Không tìm thấy bàn');
    query = { table_id: table._id };
  }

  // 1. Tìm đơn hàng chưa hoàn thành của bàn này
  const orders = await Order.find({
    ...query,
    status: { $nin: ['completed', 'cancelled'] }
  })
    .populate('table_id', 'table_number location')
    .populate('guest_id', 'username text_color')
    .sort({ createdAt: -1 });

  if (!orders || orders.length === 0) {
    return createResponse(res, 200, 'Bàn trống', []);
  }

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

  // 2. Trộn dữ liệu và TÍNH TOÁN LẠI TỔNG TIỀN (Chỉ tính món đã phục vụ)
  const ordersWithItems = orders.map((order) => {
    const plainOrder = order.toObject();
    const items = groupedItems[order._id.toString()] || [];
    plainOrder.items = items;

    // NGHIỆP VỤ: Chỉ tính tiền món 'served' để khách biết họ phải trả bao nhiêu cho đồ đã nhận
    plainOrder.total_amount = items.reduce((sum, it) => {
      if (it.status === 'served' || it.status === 'Đã phục vụ') {
        return sum + (Number(it.price) * Number(it.quantity));
      }
      return sum;
    }, 0);

    return plainOrder;
  });

  return createResponse(res, 200, 'Lấy danh sách món thành công', ordersWithItems);
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


export const switchTable = handleAsync(async (req, res) => {
  const { oldTableId, newTableId } = req.body;

  // 1. Chuyển tất cả đơn hàng sang bàn mới
  await Order.updateMany(
    { table_id: oldTableId, status: { $nin: ['paid', 'completed', 'cancelled'] } },
    { $set: { table_id: newTableId } }
  );

  // 2. CẬP NHẬT TRẠNG THÁI BÀN (Đây là phần Khanh đang thiếu)
  // Bàn cũ khách vừa đi -> Trở về Sẵn sàng (available/sẵn sàng tùy enum của bạn)
  await Table.findByIdAndUpdate(oldTableId, { status: 'available' });

  // Bàn mới khách vừa sang -> Chuyển sang Đang sử dụng
  await Table.findByIdAndUpdate(newTableId, { status: 'occupied' });

  return createResponse(res, 200, 'Chuyển bàn và cập nhật trạng thái thành công');
});