import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  table_number: {
    type: Number,
    required: [true, 'Vui lòng nhập số bàn'],
    unique: true // Đảm bảo không trùng số bàn
  },
  capacity: {
    type: Number,
    required: [true, 'Vui lòng nhập sức chứa (số người)'],
    default: 4
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'out_of_service'],
    default: 'available'
  },
  qr_code: {
    type: String,
    default: '' // Bạn có thể lưu link hoặc mã định danh để khách quét tại bàn
  },
  location: {
    type: String, // Ví dụ: 'Tầng 1', 'Ngoài trời', 'Phòng VIP'
    trim: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Table = mongoose.model('Table', tableSchema);

export default Table;