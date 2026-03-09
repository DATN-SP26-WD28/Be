import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  printer_ip: { 
    type: String, 
    default: "127.0.0.1" 
  }, 
  description: { 
    type: String 
  }
}, { timestamps: true });

const Station = mongoose.model('Station', stationSchema);
export default Station;