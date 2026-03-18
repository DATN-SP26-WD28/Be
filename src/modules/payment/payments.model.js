import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  invoice_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  method: {
    type: String,
    enum: ['cash', 'banking', 'momo', 'vnpay'],
    required: true
  },
  amount_paid: {
    type: Number,
    required: true,
    min: 0
  },
  transaction_id: {
    type: String, // Mã giao dịch từ ngân hàng hoặc ví điện tử
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending'
  },
  note: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;