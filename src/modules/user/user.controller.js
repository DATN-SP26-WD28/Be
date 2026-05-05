import createResponse from "../../shared/utils/createResponse.js";
import handleAsync from "../../shared/utils/handleAsync.js";
import User from "./user.model.js";
import { Order } from "../orders/orders.model.js";
import bcrypt from 'bcryptjs';

// 1. Khách xem hồ sơ của chính mình
export const getMe = handleAsync(async (req, res) => {
    console.log("Dữ liệu User từ Token:", req.user); // Xem nó có ra ID không
    if (!req.user) {
        return res.status(401).json({ message: "Không tìm thấy thông tin user trong request" });
    }
    const user = await User.findById(req.user.id);
    createResponse(res, 200, "Tải hồ sơ thành công", user);
});

// 2. Khách cập nhật hồ sơ
export const updateMe = handleAsync(async (req, res) => {
    const { username, email, phone } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { username, email, phone },
        { new: true, runValidators: true }
    );
    createResponse(res, 200, "Cập nhật hồ sơ thành công", updatedUser);
});

// 3. Khách xem lịch sử đơn hàng của chính mình (MỚI)
export const getMyOrders = handleAsync(async (req, res) => {
    // Tìm tất cả đơn hàng có user_id khớp với id của khách đang đăng nhập
    const orders = await Order.find({ user_id: req.user.id }).sort({ createdAt: -1 });

    createResponse(res, 200, "Lấy lịch sử đơn hàng thành công", orders);
});



// 4.1. Admin lấy tất cả khách hàng (role = customer)
export const getCustomers = handleAsync(async (req, res) => {
    const customers = await User.find({ role: 'customer' }).sort({ created_at: -1 });
    createResponse(res, 200, "Lấy danh sách thành công", customers);
});

// 4.2. Admin lấy tất cả người dùng (deprecated - dùng getStaff hoặc getCustomers)
export const getAllUsers = handleAsync(async (req, res) => {
    const users = await User.find().sort({ created_at: -1 });
    createResponse(res, 200, "Lấy danh sách người dùng thành công", users);
});

// 5. Admin Khóa/Mở khóa người dùng (Thay thế cho Xóa)
export const toggleUserStatus = handleAsync(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return createResponse(res, 404, "Không tìm thấy người dùng");
    }

    // Logic: Nếu đang active thì chuyển thành banned và ngược lại
    user.status = user.status === 'active' ? 'banned' : 'active';
    await user.save();

    const message = user.status === 'banned' ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản";
    createResponse(res, 200, message, user);
});

// 6. Admin tạo người dùng mới (Customer)
export const createUser = handleAsync(async (req, res) => {
    // 1. Nhận thêm role từ req.body
    const { name, email, phone, password, role } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !email || !phone) {
        return createResponse(res, 400, "Vui lòng cung cấp đầy đủ thông tin: name, email, phone");
    }

    // 2. Validate role (Chỉ cho phép 'customer' hoặc 'staff')
    // Nếu không truyền role, bạn có thể để mặc định là 'customer'
    const allowedRoles = ['customer', 'staff'];
    const finalRole = allowedRoles.includes(role) ? role : 'customer';

    // Validate username (chỉ chứa chữ và khoảng trắng)
    if (name && !/^[\p{L}\s]+$/u.test(name)) {
        return createResponse(res, 400, "Tên người dùng không hợp lệ (chỉ chứa chữ cái)");
    }

    // Validate phone (10-11 chữ số)
    if (!/^[0-9]{10,11}$/.test(phone)) {
        return createResponse(res, 400, "Số điện thoại không hợp lệ (chỉ chứa 10-11 chữ số)");
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return createResponse(res, 409, "Email đã tồn tại");
    }

    // Kiểm tra username đã tồn tại
    const existingUsername = await User.findOne({ username: name });
    if (existingUsername) {
        return createResponse(res, 409, "Tên đăng nhập đã tồn tại");
    }

    // Hash password
    const defaultPassword = password || '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 3. Sử dụng finalRole đã validate
    const newUser = await User.create({
        username: name,
        email,
        phone,
        role: finalRole,
        password: hashedPassword
    });

    // Ẩn password trước khi trả về response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    createResponse(res, 201, "Tạo người dùng thành công", userResponse);
});
// 7. Admin cập nhật thông tin người dùng
export const updateUser = handleAsync(async (req, res) => {
    const { id } = req.params;
    const { username, email, phone, role, password } = req.body;

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role; // Bây giờ đã có thể update thoải mái

    if (password && password.trim() !== "") {
        updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    if (!updatedUser) return createResponse(res, 404, "Không tìm thấy người dùng");

    createResponse(res, 200, "Cập nhật người dùng thành công", updatedUser);
});

// 8. Admin xóa người dùng
export const deleteUser = handleAsync(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
        return createResponse(res, 404, "Không tìm thấy người dùng");
    }

    createResponse(res, 200, "Xóa người dùng thành công", user);
});