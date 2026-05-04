import jwt from 'jsonwebtoken';
import handleAsync from '../../shared/utils/handleAsync.js';
import createResponse from '../../shared/utils/createResponse.js';
import createError from '../../shared/utils/createError.js';
import bcrypt from 'bcryptjs'
import User from './auth.model.js';

export const register = handleAsync(async (req, res) => {
  const { email, password, username, phone, role } = req.body;

  const existingUser = await User.findOne({ email });
  // SỬA: Thêm res vào tham số đầu tiên
  if (existingUser) throw createError(res, 400, 'Email đã tồn tại');

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    username,
    email,
    phone,
    role: role || 'customer', // Mặc định là customer nếu không truyền
    password: hashedPassword
  });

  return createResponse(res, 201, 'Đăng ký thành công', { userId: newUser._id });
});

export const login = handleAsync(async (req, res) => {
  const { email, password } = req.body;

  // SỬA: Dùng .select('+password') vì trong model bạn để select: false
  const user = await User.findOne({ email }).select('+password');

  // SỬA: Thêm res vào tham số đầu tiên
  if (!user) throw createError(res, 404, 'Người dùng không tồn tại');

  const isMatch = await bcrypt.compare(password, user.password);

  // Dòng này bạn đã viết đúng cấu trúc
  if (!isMatch) throw createError(res, 401, 'Mật khẩu không chính xác');

  if (user.status === 'banned') {
    return res.status(403).json({
      message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên."
    });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  // Tạo thêm Refresh Token nếu bạn muốn đồng bộ với logic Guest
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return createResponse(res, 200, 'Đăng nhập thành công', {
    token,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      role: user.role
    }
  });
});