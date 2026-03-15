import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  dish_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dish',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Số lượng phải ít nhất là 1'],
    default: 1
  },
  note: {
    type: String, // Ví dụ: "Ít cay", "Không hành"
    trim: true
  }
});

const cartSchema = new mongoose.Schema({
  table_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: [true, 'Giỏ hàng phải gắn liền với một bàn']
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Phải có người dùng (hoặc khách) tạo giỏ hàng']
  },
  items: [cartItemSchema], // Nhúng trực tiếp các món ăn vào giỏ hàng
  status: {
    type: String,
    enum: ['active', 'converted', 'cancelled'], // active: đang chọn, converted: đã thanh toán/lên đơn
    default: 'active'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;