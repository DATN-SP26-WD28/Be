import mongoose from 'mongoose';

const feedbackResponseSchema = new mongoose.Schema({
  feedback_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback',
    required: [true, 'Phải phản hồi dựa trên một đánh giá cụ thể'],
    unique: true // Một đánh giá chỉ nên có 1 phản hồi từ admin
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: [true, 'Thiếu ID người phản hồi']
  },
  content: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung phản hồi'],
    trim: true,
    maxlength: [1000, 'Nội dung phản hồi không quá 1000 ký tự']
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const FeedbackResponse = mongoose.model('FeedbackResponse', feedbackResponseSchema);
export default FeedbackResponse;