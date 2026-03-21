import createResponse from "../../shared/utils/createResponse.js";
import handleAsync from "../../shared/utils/handleAsync.js";
import bcrypt from 'bcryptjs';
import Customer from './customer.model.js';

// 1. Lấy danh sách tất cả khách hàng
export const getAllCustomers = handleAsync(async (req, res) => {
    const customers = await Customer.find().select('-password').sort({ created_at: -1 });
    createResponse(res, 200, "Lấy danh sách khách hàng thành công", customers);
});

// 2. Lấy khách hàng theo ID
export const getCustomerById = handleAsync(async (req, res) => {
    const customer = await Customer.findById(req.params.id).select('-password');
    if (!customer) {
        return createResponse(res, 404, "Không tìm thấy khách hàng");
    }
    createResponse(res, 200, "Lấy thông tin khách hàng thành công", customer);
});

// 3. Tạo khách hàng mới
export const createCustomer = handleAsync(async (req, res) => {
    const { username, email, phone, password } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!username || !email || !phone) {
        return createResponse(res, 400, "Vui lòng cung cấp đầy đủ: username, email, phone");
    }

    // Kiểm tra email đã tồn tại
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
        return createResponse(res, 409, "Email đã được sử dụng bởi khách hàng khác");
    }

    // Kiểm tra username đã tồn tại
    const existingUsername = await Customer.findOne({ username });
    if (existingUsername) {
        return createResponse(res, 409, "Tên khách hàng đã tồn tại");
    }

    // Hash password
    const defaultPassword = password || '123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const newCustomer = await Customer.create({
        username,
        email,
        phone,
        password: hashedPassword,
        role: 'customer' // Luôn là customer
    });

    createResponse(res, 201, "Tạo khách hàng thành công", newCustomer);
});

// 4. Cập nhật thông tin khách hàng
export const updateCustomer = handleAsync(async (req, res) => {
    const { id } = req.params;
    const { username, email, phone, password, loyalty_points, total_spent } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
        return createResponse(res, 404, "Không tìm thấy khách hàng");
    }

    // Kiểm tra email đã tồn tại (nếu email được cập nhật)
    if (email && email !== customer.email) {
        const existingEmail = await Customer.findOne({ email });
        if (existingEmail) {
            return createResponse(res, 409, "Email đã được sử dụng bởi khách hàng khác");
        }
    }

    // Kiểm tra username đã tồn tại (nếu username được cập nhật)
    if (username && username !== customer.username) {
        const existingUsername = await Customer.findOne({ username });
        if (existingUsername) {
            return createResponse(res, 409, "Tên khách hàng đã tồn tại");
        }
    }

    // Cập nhật các trường được cung cấp
    if (username) customer.username = username;
    if (email) customer.email = email;
    if (phone) customer.phone = phone;
    if (password) customer.password = await bcrypt.hash(password, 10);
    if (loyalty_points !== undefined) customer.loyalty_points = loyalty_points;
    if (total_spent !== undefined) customer.total_spent = total_spent;
    customer.last_visit = new Date();

    const updatedCustomer = await customer.save();

    createResponse(res, 200, "Cập nhật khách hàng thành công", updatedCustomer);
});

// 5. Xóa khách hàng
export const deleteCustomer = handleAsync(async (req, res) => {
    const { id } = req.params;

    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
        return createResponse(res, 404, "Không tìm thấy khách hàng");
    }

    createResponse(res, 200, "Xóa khách hàng thành công", customer);
});

// 6. Khóa/Mở khóa khách hàng
export const toggleCustomerStatus = handleAsync(async (req, res) => {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
        return createResponse(res, 404, "Không tìm thấy khách hàng");
    }

    customer.status = customer.status === 'active' ? 'banned' : 'active';
    await customer.save();

    const message = customer.status === 'banned' ? "Đã khóa khách hàng" : "Đã mở khóa khách hàng";
    createResponse(res, 200, message, customer);
});

// 7. Cập nhật điểm loyalty
export const addLoyaltyPoints = handleAsync(async (req, res) => {
    const { id } = req.params;
    const { points } = req.body;

    if (!points || points < 0) {
        return createResponse(res, 400, "Điểm phải là số dương");
    }

    const customer = await Customer.findByIdAndUpdate(
        id,
        { $inc: { loyalty_points: points } },
        { new: true, runValidators: true }
    );

    if (!customer) {
        return createResponse(res, 404, "Không tìm thấy khách hàng");
    }

    createResponse(res, 200, "Cập nhật điểm loyalty thành công", customer);
});
