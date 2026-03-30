import jwt from "jsonwebtoken";
import User from "../../modules/auth/auth.model.js";
import Guest from "../../modules/guest/Guest.model.js";
import handleAsync from "../utils/handleAsync.js";
import createError from "../utils/createError.js";

// 1. Middleware bảo vệ: Kiểm tra Token và xác thực người dùng/khách
export const protect = handleAsync(async (req, res, next) => {
  let token;

  // Lấy token từ Header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(createError(res, 401, "Bạn chưa đăng nhập! Vui lòng quét mã QR hoặc đăng nhập."));
  }

  try {
    // 1. Giải mã Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Tìm User hoặc Guest tùy theo Role trong Token
    let currentUser;
    if (decoded.role === 'guest') {
      currentUser = await Guest.findById(decoded.id);
    } else {
      currentUser = await User.findById(decoded.id);
    }

    if (!currentUser) {
      return next(createError(res, 401, "Người dùng hoặc phiên làm việc này không còn tồn tại."));
    }

    // 3. GÁN DỮ LIỆU VÀO REQ.USER (Khớp với sơ đồ ERD của bạn)
    // Lưu ý: Lấy table_id từ decoded (Token) vì Guest gắn liền với bàn khi login
    req.user = {
      id: currentUser._id,
      role: decoded.role,
      username: currentUser.username,
      table_id: decoded.table_id || null,
      table_number: decoded.table_number || null
    };

    next();
  } catch (error) {
    // Xử lý riêng lỗi hết hạn để Frontend (React) có thể bắt được và dùng Refresh Token
    if (error.name === "TokenExpiredError") {
      return next(createError(res, 401, "Phiên làm việc đã hết hạn (JWT expired)."));
    }
    if (error.name === "JsonWebTokenError") {
      return next(createError(res, 401, "Mã xác thực không hợp lệ."));
    }
    next(error);
  }
});

// 2. Middleware phân quyền: Chặn theo Role (admin, staff, guest...)
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user đã được gán dữ liệu ở middleware protect phía trên
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createError(res, 403, "Bạn không có quyền truy cập chức năng này!"));
    }
    next();
  };
};