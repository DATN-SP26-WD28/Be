import User from './auth.model.js';
import jwt from 'jsonwebtoken';
import handleAsync  from '../../shared/utils/handleAsync.js';
import createResponse  from '../../shared/utils/createResponse.js';
import  createError  from '../../shared/utils/createError.js';
import bcrypt from 'bcryptjs'

export const register = handleAsync(async (req, res) => {
  const { email, password, username, phone, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw createError(400, 'Email đã tồn tại');

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    username, email, phone, role,
    password: hashedPassword
  });

  return createResponse(res, 201, 'Đăng ký thành công', { userId: newUser._id });
});

export const login = handleAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw createError(404, 'Người dùng không tồn tại');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw createError(401, 'Mật khẩu không chính xác');

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return createResponse(res, 200, 'Đăng nhập thành công', { 
    token, 
    user: { username: user.username, role: user.role } 
  });
});