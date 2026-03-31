
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
  table_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  // Hỗ trợ cả khách thành viên và khách vãng lai
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guest_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Guest', default: null },
  
  total_amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'preparing', 'ready', 'served', 'completed', 'canceled'],
    default: 'pending' 
  },
  note: { type: String }
}, { timestamps: true });

export const Order = mongoose.model('Order', orderSchema);
export const OrderStatusHistory = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);
