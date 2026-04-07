import createResponse from "../../shared/utils/createResponse.js";
import handleAsync from "../../shared/utils/handleAsync.js";
import Invoice from "./Invoice.model.js";


// 1. Lấy toàn bộ danh sách hóa đơn (Có phân trang & sắp xếp)
export const getAllInvoices = handleAsync(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const invoices = await Invoice.find()
        .populate('table_id', 'table_number')
        .populate('user_id', 'username') // Nhân viên thanh toán
        .sort({ createdAt: -1 }) // Mới nhất lên đầu
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Invoice.countDocuments();

    return createResponse(res, 200, 'Lấy danh sách hóa đơn thành công', {
        invoices,
        totalPages: Math.ceil(total / limit),
        currentPage: page
    });
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