import createResponse from "../../shared/utils/createResponse.js";
import handleAsync from "../../shared/utils/handleAsync.js";
import { OrderItem } from "../order_items/order_items.model.js";
import Invoice from "./Invoice.model.js";


// 1. Lấy toàn bộ danh sách hóa đơn (Có phân trang & sắp xếp)
// Backend: file invoice.controller.js

export const getAllInvoices = handleAsync(async (req, res) => {
  // 1. Lấy tất cả hóa đơn và CHỈ populate order_ids ở mức cơ bản
  const invoices = await Invoice.find()
    .populate('table_id')
    .populate('order_ids') // Chỉ lấy ra các Order, chưa có Items
    .sort({ created_at: -1 })
    .lean(); // QUAN TRỌNG: Dùng .lean() để biến Mongoose Document thành Object Javascript thường, giúp ta tự do thêm thuộc tính 'items'

  if (!invoices || invoices.length === 0) {
    return createResponse(res, 200, "Lấy danh sách thành công", []);
  }

  // 2. Gom TẤT CẢ ID đơn hàng (order_ids) từ các hóa đơn vào 1 mảng duy nhất
  const allOrderIds = [];
  invoices.forEach(inv => {
    if (inv.order_ids && inv.order_ids.length > 0) {
      inv.order_ids.forEach(order => {
        allOrderIds.push(order._id);
      });
    }
  });

  // 3. Chọc vào bảng OrderItem: Lấy tất cả món ăn thuộc các đơn hàng trên
  const allOrderItems = await OrderItem.find({ order_id: { $in: allOrderIds } })
    .populate('dish_id', 'dish_name price image_url'); // Lấy luôn tên món

  // 4. Lắp ráp: Nhét các món ăn vào đúng đơn hàng của nó
  invoices.forEach(inv => {
    if (inv.order_ids) {
      inv.order_ids.forEach(order => {
        // Lọc ra những món ăn có order_id trùng với _id của đơn hàng hiện tại
        order.items = allOrderItems.filter(
          item => item.order_id.toString() === order._id.toString()
        );
      });
    }
  });

  // Trả về Frontend
  return createResponse(res, 200, "Lấy danh sách hóa đơn thành công", invoices);
});

// 2. Lấy chi tiết 1 hóa đơn
export const getInvoiceById = handleAsync(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id)
        .populate('table_id')
        .populate({
            path: 'order_id',
            populate: { path: 'items.dish_id' } // Lấy chi tiết món ăn trong hóa đơn
        });

    if (!invoice) return createResponse(res, 404, 'Không tìm thấy hóa đơn');

    return createResponse(res, 200, 'Thành công', invoice);
});

// 3. HÀM QUAN TRỌNG: Lấy thống kê tổng hợp cho Dashboard
export const getInvoiceStats = handleAsync(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tính tổng doanh thu và số đơn hàng
    const stats = await Invoice.aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$total_amount" },
                totalInvoices: { $sum: 1 },
                avgInvoiceValue: { $avg: "$total_amount" }
            }
        }
    ]);

    // Doanh thu hôm nay
    const revenueToday = await Invoice.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, amount: { $sum: "$total_amount" } } }
    ]);

    // Thống kê 6 tháng gần nhất (Dùng cho Sparkline/Chart)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const monthlyRevenue = await Invoice.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { $month: "$createdAt" },
                revenue: { $sum: "$total_amount" }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    return createResponse(res, 200, 'Lấy thống kê thành công', {
        overall: stats[0] || { totalRevenue: 0, totalInvoices: 0 },
        revenueToday: revenueToday[0]?.amount || 0,
        monthlyChart: monthlyRevenue
    });
});

// 4. Xóa hóa đơn
export const deleteInvoice = handleAsync(async (req, res) => {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return createResponse(res, 404, 'Không tìm thấy hóa đơn để xóa');

    return createResponse(res, 200, 'Đã xóa hóa đơn thành công');
});