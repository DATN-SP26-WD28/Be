import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoice_number: {
    type: String,
    unique: true,
    required: true // Ví dụ: INV-20260317-001
  },
  table_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Khách hàng thanh toán
    required: true
  },
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'cancelled', 'merged'],
    default: 'unpaid'
  },
  payment_method: {
    type: String,
    enum: ['cash', 'banking', 'momo', 'vnpay'],
    default: 'cash'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

export default Invoice;