import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
  customer_name: { type: String, required: true },
  customer_phone: { type: String, required: true },
  party_size: { type: Number, required: true }, 
  queue_number: { type: String }, 
  status: { 
    type: String, 
    enum: ['waiting', 'seated', 'cancelled', 'not_present'], 
    default: 'waiting' 
  },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  cart_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' }, 
  assigned_table_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' }, 
  note: { type: String }
}, { timestamps: true });

// Logic tự động tạo số thứ tự (Ví dụ đơn giản: Q-12345)
queueSchema.pre('save', function(next) {
  if (!this.queue_number) {
    this.queue_number = 'Q-' + Math.floor(1000 + Math.random() * 9000);
  }
  next();
});

const Queue = mongoose.model('Queue', queueSchema);
export default Queue;