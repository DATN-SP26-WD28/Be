import createResponse from "../../shared/utils/createResponse.js";
import handleAsync from "../../shared/utils/handleAsync.js";
import bcrypt from 'bcryptjs';
import Staff from './staff.model.js';

// 1. Lấy danh sách tất cả nhân viên
export const getAllStaff = handleAsync(async (req, res) => {
    const staff = await Staff.find().select('-password').sort({ created_at: -1 });
    createResponse(res, 200, "Lấy danh sách nhân viên thành công", staff);
});

// 2. Lấy nhân viên theo ID
export const getStaffById = handleAsync(async (req, res) => {
    const staff = await Staff.findById(req.params.id).select('-password');
    if (!staff) {
        return createResponse(res, 404, "Không tìm thấy nhân viên");
    }
    createResponse(res, 200, "Lấy thông tin nhân viên thành công", staff);
});

// 3. Tạo nhân viên mới
export const createStaff = handleAsync(async (req, res) => {
    const { username, email, phone, role, password, department, salary } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!username || !email || !phone || !role) {
        return createResponse(res, 400, "Vui lòng cung cấp đầy đủ: username, email, phone, role");
    }

    // Kiểm tra email đã tồn tại
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
        return createResponse(res, 409, "Email đã được sử dụng bởi nhân viên khác");
    }

    // Kiểm tra username đã tồn tại
    const existingUsername = await Staff.findOne({ username });
    if (existingUsername) {
        return createResponse(res, 409, "Tên nhân viên đã tồn tại");
    }

    // Hash password
    const defaultPassword = password || '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const newStaff = await Staff.create({
        username,
        email,
        phone,
        role,
        password: hashedPassword,
        department,
        salary,
    });

    createResponse(res, 201, "Tạo nhân viên thành công", newStaff);
});

// 4. Cập nhật thông tin nhân viên
export const updateStaff = handleAsync(async (req, res) => {
    const { id } = req.params;
    const { username, email, phone, role, password, department, salary } = req.body;

    const staff = await Staff.findById(id);
    if (!staff) {
        return createResponse(res, 404, "Không tìm thấy nhân viên");
    }

    // Kiểm tra email đã tồn tại (nếu email được cập nhật)
    if (email && email !== staff.email) {
        const existingEmail = await Staff.findOne({ email });
        if (existingEmail) {
            return createResponse(res, 409, "Email đã được sử dụng bởi nhân viên khác");
        }
    }

    // Kiểm tra username đã tồn tại (nếu username được cập nhật)
    if (username && username !== staff.username) {
        const existingUsername = await Staff.findOne({ username });
        if (existingUsername) {
            return createResponse(res, 409, "Tên nhân viên đã tồn tại");
        }
    }

    // Cập nhật các trường được cung cấp
    if (username) staff.username = username;
    if (email) staff.email = email;
    if (phone) staff.phone = phone;
    if (role) staff.role = role;
    if (password) staff.password = await bcrypt.hash(password, 10);
    if (department !== undefined) staff.department = department;
    if (salary !== undefined) staff.salary = salary;

    const updatedStaff = await staff.save();

    createResponse(res, 200, "Cập nhật nhân viên thành công", updatedStaff);
});

// 5. Xóa nhân viên
export const deleteStaff = handleAsync(async (req, res) => {
    const { id } = req.params;

    const staff = await Staff.findByIdAndDelete(id);
    if (!staff) {
        return createResponse(res, 404, "Không tìm thấy nhân viên");
    }

    createResponse(res, 200, "Xóa nhân viên thành công", staff);
});

// 6. Khóa/Mở khóa nhân viên
export const toggleStaffStatus = handleAsync(async (req, res) => {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
        return createResponse(res, 404, "Không tìm thấy nhân viên");
    }

    staff.status = staff.status === 'active' ? 'banned' : 'active';
    await staff.save();

    const message = staff.status === 'banned' ? "Đã khóa nhân viên" : "Đã mở khóa nhân viên";
    createResponse(res, 200, message, staff);
});

// 7. Tìm nhân viên theo role
export const getStaffByRole = handleAsync(async (req, res) => {
    const { role } = req.params;
    const validRoles = ['waiter', 'cashier', 'chef', 'admin'];
    
    if (!validRoles.includes(role)) {
        return createResponse(res, 400, `Vai trò không hợp lệ. Phải là: ${validRoles.join(', ')}`);
    }

    const staff = await Staff.find({ role }).select('-password').sort({ created_at: -1 });
    createResponse(res, 200, `Lấy danh sách ${role} thành công`, staff);
});
