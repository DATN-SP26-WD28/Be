import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Vui lòng nhập tên đăng nhập'],
    unique: true,
    trim: true,
    minlength: [3, 'Tên đăng nhập phải ít nhất 3 ký tự'],
    maxlength: [50, 'Tên đăng nhập không được vượt quá 50 ký tự'],
    match: [/^[a-zA-Z\s]+$/, 'Tên không hợp lệ']
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [100, 'Email không được vượt quá 100 ký tự'],
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  phone: {
    type: String,
    required: [true, 'Vui lòng nhập số điện thoại'],
    trim: true,
    match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải từ 6 ký tự trở lên'],
    select: false
  },
  role: {
    type: String,
    enum: {
      values: ['customer'],
      message: 'Vai trò người dùng phải là customer'
    },
    default: 'customer',
    immutable: true
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'banned'],
      message: 'Trạng thái người dùng không hợp lệ (active hoặc banned)'
    },
    default: 'active'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Middleware to remove password from serialized output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
