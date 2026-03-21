import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Vui lòng nhập tên nhân viên'],
    unique: true,
    trim: true,
    minlength: [3, 'Tên nhân viên phải ít nhất 3 ký tự'],
    maxlength: [50, 'Tên nhân viên không được vượt quá 50 ký tự'],
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
      values: ['waiter', 'cashier', 'chef', 'admin'],
      message: 'Vai trò nhân viên không hợp lệ. Phải là: waiter, cashier, chef, admin'
    },
    required: [true, 'Vui lòng chọn vai trò nhân viên'],
    default: 'waiter'
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'banned'],
      message: 'Trạng thái không hợp lệ. Phải là: active hoặc banned'
    },
    default: 'active'
  },
  department: {
    type: String, // Ví dụ: 'Kitchen', 'Front of House', 'Management'
    trim: true
  },
  salary: {
    type: Number,
    min: [0, 'Lương không được âm']
  },
  hire_date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Middleware: Không cho phép xóa password
staffSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
