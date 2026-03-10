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
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, 
  cart_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' }, 
  assigned_table_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' }, 
  note: { type: String }
}, { timestamps: true });

// Sửa lại Middleware sang async function hoàn chỉnh
// Không truyền 'next' để tránh lỗi "next is not a function"
queueSchema.pre('save', async function() {
  if (!this.queue_number) {
    // Logic tạo số thứ tự ngẫu nhiên
    this.queue_number = 'Q-' + Math.floor(1000 + Math.random() * 9000);
  }
});

const Queue = mongoose.model('Queue', queueSchema);
export default Queue;