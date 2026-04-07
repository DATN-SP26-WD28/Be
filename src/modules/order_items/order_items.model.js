
import mongoose from 'mongoose';

const orderItemsSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  dish_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  note: { type: String },
  status: {
    type: String,
enum: ['pending', 'confirmed', 'served', 'canceled'],
    default: 'pending',
  },
  subTotal: { type: Number, required: true },
  total_amount: { type: Number, required: true },
});

const orderItemStatusHistorySchema = new mongoose.Schema({
  order_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem' },
  old_status: { type: String, required: true },
  new_status: { type: String, required: true },
  changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changed_at: { type: Date, default: Date.now },
  note: { type: String },
});

export const OrderItem = mongoose.model('OrderItem', orderItemsSchema);
export const OrderItemStatusHistory = mongoose.model('OrderItemStatusHistory', orderItemStatusHistorySchema);
