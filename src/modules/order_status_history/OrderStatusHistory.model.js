import mongoose from 'mongoose';

const orderStatusHistorySchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  old_status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled']
  },
  new_status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled'],
    required: true
  },
  changed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Thường là Admin hoặc Thu ngân
    required: true
  },
  note: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: 'changed_at', updatedAt: false }
});

const OrderStatusHistory = mongoose.models.OrderStatusHistory || mongoose.model('OrderStatusHistory', orderStatusHistorySchema);

export default OrderStatusHistory;