import mongoose from 'mongoose';

const guestSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Vui lòng nhập tên để nhà hàng xưng hô'],
        trim: true,
        maxlength: [30, 'Tên quá dài']
    },
    table_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        required: true
    },
    role: {
        type: String,
        default: 'guest'
    },
    session_token: { type: String }
}, {
    timestamps: true
});

// Tự động xóa dữ liệu khách vãng lai sau 24h để sạch DB
guestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Guest = mongoose.model('Guest', guestSchema);
export default Guest;