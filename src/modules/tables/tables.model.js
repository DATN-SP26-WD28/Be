import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  table_number: { type: String, required: true, unique: true },
  capacity: { type: Number, default: 4 }, // Số lượng người ngồi tối đa
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'reserved', 'out_of_service'], 
    default: 'available' 
  },
  qr_code: { type: String }, // Link hoặc mã định danh để tạo QR
  current_cart_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' } // Giỏ hàng hiện tại của bàn
}, { timestamps: true });

const Table = mongoose.model('Table', tableSchema);
export default Table;