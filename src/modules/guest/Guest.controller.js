import jwt from 'jsonwebtoken';
import Table from '../tables/tables.model.js';
import Guest from './Guest.model.js';
import createError from '../../shared/utils/createError.js';
import handleAsync from '../../shared/utils/handleAsync.js';
import createResponse from '../../shared/utils/createResponse.js';


export const guestController = {
    /**
     * 1. Đăng nhập vãng lai (Gắn với bàn cụ thể)
     * Payload: { username, table_number, token }
     */
    login: handleAsync(async (req, res) => {
        const { username, table_number, token } = req.body;

        // A. Kiểm tra tính hợp lệ của bàn và QR Token
        const table = await Table.findOne({ table_number });
        if (!table) {
            throw createError(res, 404, 'Không tìm thấy thông tin bàn ăn này');
        }

        // So khớp token từ QR khách quét với token lưu trong DB của bàn đó
        if (!token || table.token !== token) {
            throw createError(res, 403, 'Mã QR không hợp lệ hoặc đã hết hạn. Vui lòng quét lại!');
        }

        // B. Tạo phiên làm việc cho khách (Guest Session)
        const newGuest = await Guest.create({
            username,
            table_id: table._id,
            role: 'guest'
        });

        // C. Cập nhật trạng thái bàn sang "Đang dùng" (Occupied)
        if (table.status !== 'occupied') {
            table.status = 'occupied';
            await table.save();
        }

        // D. Tạo Access Token (Payload chứa đầy đủ thông tin định danh)
        const accessToken = jwt.sign(
            {
                id: newGuest._id,
                username: newGuest.username,
                role: 'guest',
                table_id: table._id,
                table_number: table.table_number
            },
            process.env.JWT_SECRET,
            { expiresIn: '12h' } // Khách vãng lai chỉ có tác dụng trong ngày
        );

        return createResponse(res, 200, `Chào mừng ${username} đến với Roosta!`, {
            guest: {
                id: newGuest._id,
                username: newGuest.username,
                role: 'guest',
                table_number: table.table_number,
                table_id: table._id
            },
            accessToken
        });
    }),

    /**
     * 2. Lấy thông tin phiên làm việc hiện tại (Dùng khi refresh trang)
     * Yêu cầu qua Middleware verifyToken
     */
    getMe: handleAsync(async (req, res) => {
        // req.user được gán từ Middleware verifyToken
        const guest = await Guest.findById(req.user.id).populate('table_id');

        if (!guest) {
            throw createError(res, 404, 'Phiên làm việc của bạn đã hết hạn');
        }

        return createResponse(res, 200, 'Lấy thông tin thành công', guest);
    }),

    /**
     * 3. Kết thúc bữa ăn (Đăng xuất)
     */
    logout: handleAsync(async (req, res) => {
        const guestId = req.user.id;
        const guest = await Guest.findById(guestId);

        if (guest) {
            // Tùy chọn: Nếu khách cuối cùng rời đi, bạn có thể cân nhắc reset bàn về available
            // Nhưng thường việc này sẽ do nhân viên làm tại quầy khi thanh toán.
            await Guest.findByIdAndDelete(guestId);
        }

        return createResponse(res, 200, 'Cảm ơn bạn đã sử dụng dịch vụ của Roosta!');
    })
};