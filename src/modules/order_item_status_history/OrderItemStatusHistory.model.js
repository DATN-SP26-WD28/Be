import mongoose from 'mongoose';

const orderItemStatusHistorySchema = new mongoose.Schema({
  order_item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderItem', 
    required: true
  },
  old_status: {
    type: String,
    enum: ['pending', 'cooking', 'ready', 'served', 'cancelled']
  },
  new_status: {
    type: String,
    enum: ['pending', 'cooking', 'ready', 'served', 'cancelled'],
    required: true
  },
  changed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  note: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: 'changed_at', updatedAt: false } 
});


const OrderItemStatusHistory = mongoose.models.OrderItemStatusHistory || mongoose.model('OrderItemStatusHistory', orderItemStatusHistorySchema);

export default OrderItemStatusHistory;