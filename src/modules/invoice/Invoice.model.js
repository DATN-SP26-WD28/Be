import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  invoice_number: {
    type: String,
    unique: true,
    required: true // Ví dụ: INV-20260402-001
  },
  table_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  // THAY ĐỔI Ở ĐÂY: Lưu danh sách tất cả các đơn hàng lẻ của lượt ăn này
  order_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Cho phép null nếu là khách vãng lai
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'cancelled'],
    default: 'unpaid'
  },
  payment_method: {
    type: String,
    enum: ['cash', 'banking', 'momo', 'vnpay'],
    default: 'cash'
  },
  // Thêm thông tin chia tiền nếu Khanh muốn làm tính năng Split Bill
  split_count: { type: Number, default: 1 },
  amount_per_person: { type: Number, default: 0 }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

export default Invoice;