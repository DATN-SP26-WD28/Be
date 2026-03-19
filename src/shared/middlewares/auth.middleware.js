import jwt from "jsonwebtoken";
import User from "../../modules/auth/auth.model.js";
import handleAsync from "../utils/handleAsync.js";
import createError from "../utils/createError.js";

// 1. Middleware bảo vệ: Kiểm tra đăng nhập
export const protect = handleAsync(async (req, res, next) => {
  let token;

  // Kiểm tra xem Token có nằm trong Header (Authorization: Bearer <token>) không
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw createError(401, "Bạn chưa đăng nhập! Vui lòng đăng nhập để truy cập.");
  }

  // Giải mã Token (Sử dụng JWT_SECRET trong file .env)
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Tìm User từ ID đã giải mã (Trong hàm login bạn đặt là { id: user._id })
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    throw createError(401, "Người dùng sở hữu token này không còn tồn tại.");
  }

  // LƯU QUAN TRỌNG: Gán thông tin user vào request để các hàm sau (như getMe) có thể dùng
  req.user = currentUser;
  next();
});

// 2. Middleware phân quyền: Chỉ cho phép các Role cụ thể (ví dụ: Admin)
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user đã được tạo ra từ middleware protect ở trên
    if (!roles.includes(req.user.role)) {
      throw createError(403, "Bạn không có quyền thực hiện hành động này!");
    }
    next();
  };
};