import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Vui lòng nhập tên đăng nhập'],
    unique: true,
    trim: true,
    minlength: [3, 'Tên đăng nhập phải ít nhất 3 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  phone: {
    type: String,
    required: [true, 'Vui lòng nhập số điện thoại'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải từ 6 ký tự trở lên']
  },
  role: {
    type: String,
    enum: ['customer', 'waiter', 'cashier', 'chef', 'admin'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['active', 'banned'],
    default: 'active'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Middleware để mã hóa mật khẩu trước khi lưu (Sẽ dùng thư viện bcrypt sau này)
// userSchema.pre('save', async function(next) { ... });

const User = mongoose.model('User', userSchema);

export default User;