
import mongoose from 'mongoose';

const orderStatusHistorySchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  old_status: { type: String, required: true },
  new_status: { type: String, required: true },
  changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changed_at: { type: Date, default: Date.now },
  note: { type: String },
});

const orderSchema = new mongoose.Schema({
  table_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'ready', 'served', 'canceled', 'completed'],
    default: 'pending',
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export const Order = mongoose.model('Order', orderSchema);
export const OrderStatusHistory = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);
