import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Vui lòng nhập tên khách hàng'],
    unique: true,
    minlength: [3, 'Tên khách hàng phải ít nhất 3 ký tự'],
    maxlength: [50, 'Tên khách hàng không được vượt quá 50 ký tự'],
    match: [/^[a-zA-Z\s]+$/, 'Tên không hợp lệ']
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    maxlength: [100, 'Email không được vượt quá 100 ký tự']
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
    select: false // Không trả về password khi query
  },
  role: {
    type: String,
    enum: {
      values: ['customer'],
      message: 'Khách hàng phải có role là customer'
    },
    default: 'customer',
    immutable: true // Không cho phép thay đổi role
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'banned'],
      message: 'Trạng thái không hợp lệ. Phải là: active hoặc banned'
    },
    default: 'active'
  },
  loyalty_points: {
    type: Number,
    default: 0,
    min: [0, 'Điểm không được âm']
  },
  total_spent: {
    type: Number,
    default: 0,
    min: [0, 'Tổng chi không được âm']
  },
  last_visit: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Middleware: Không cho phép xóa password
customerSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
