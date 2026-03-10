import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'reserved', 'out_of_service'], 
    default: 'available' 
  },
  token: { type: String }, // Mã định danh duy nhất cho QR
  current_order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
}, { timestamps: true });

export default mongoose.model('Table', tableSchema);