import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  invoice_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: [true, 'Giao dịch phải gắn liền với hóa đơn']
  },
  amount: {
    type: Number,
    required: [true, 'Thiếu số tiền giao dịch']
  },
  payment_method: {
    type: String,
    enum: {
      values: ['cash', 'transfer', 'vnpay'],
      message: 'Phương thức thanh toán: cash, transfer hoặc vnpay'
    },
    default: 'cash'
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'failed', 'refunded'],
      message: 'Trạng thái giao dịch không hợp lệ'
    },
    default: 'completed'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;