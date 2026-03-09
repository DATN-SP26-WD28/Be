import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['admin', 'waiter', 'chef', 'cashier', 'customer'], default: 'customer' },
  birthday: { type: Date },
  points: { type: Number, default: 0 },
  tags: [String],
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('User', userSchema);