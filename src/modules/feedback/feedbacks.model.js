import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Thiếu ID người dùng']
  },
  dish_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dish',
    required: [true, 'Thiếu ID món ăn']
  },
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Thiếu ID đơn hàng']
  },
  rating: {
    type: Number,
    required: [true, 'Vui lòng chọn số sao đánh giá'],
    min: [1, 'Đánh giá thấp nhất là 1 sao'],
    max: [5, 'Đánh giá cao nhất là 5 sao']
  },
  content: {
    type: String,
    trim: true,
    maxlength: [500, 'Nội dung đánh giá không quá 500 ký tự']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'hidden'],
      message: 'Trạng thái không hợp lệ'
    },
    default: 'pending'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;