import createError from "../../shared/utils/createError.js";
import createResponse from "../../shared/utils/createResponse.js";
import handleAsync from "../../shared/utils/handleAsync.js";
import { Order } from "../orders/orders.model.js";
import Invoice from "./Invoice.model.js";


// 1. Tạo hóa đơn mới (Khi khách nhấn thanh toán)
export const createInvoice = handleAsync(async (req, res) => {
    const { order_id, table_id, user_id, payment_method } = req.body;

    // Kiểm tra đơn hàng có tồn tại không
    const order = await Order.findById(order_id);
    if (!order) return createError(res, 404, "Không tìm thấy đơn hàng để xuất hóa đơn");

    // Tạo mã hóa đơn ngẫu nhiên hoặc theo quy tắc (INV + Timestamp)
    const invoice_number = `INV-${Date.now()}`;

    const invoice = await Invoice.create({
        invoice_number,
        table_id,
        user_id,
        order_id,
        total_amount: order.total_amount, // Lấy tổng tiền từ đơn hàng
        payment_method
    });

    return createResponse(res, 201, "Tạo hóa đơn thành công", invoice);
});

// 2. Cập nhật trạng thái đã thanh toán
export const markAsPaid = handleAsync(async (req, res) => {
    const { id } = req.params;

    const invoice = await Invoice.findByIdAndUpdate(
        id,
        { status: 'paid' },
        { new: true }
    );

    if (!invoice) return createError(res, 404, "Không tìm thấy hóa đơn");

    return createResponse(res, 200, "Hóa đơn đã được thanh toán", invoice);
});

// 3. Lấy chi tiết hóa đơn (Kèm thông tin món ăn từ Order)
export const getInvoiceDetail = handleAsync(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id)
        .populate('table_id', 'table_name')
        .populate('user_id', 'username email')
        .populate({
            path: 'order_id',
            populate: { path: 'order_items.dish_id', select: 'dish_name price' }
        });

    if (!invoice) return createError(res, 404, "Không tìm thấy hóa đơn");

    return createResponse(res, 200, "Lấy chi tiết hóa đơn thành công", invoice);
});