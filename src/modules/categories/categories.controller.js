import Category from "./categories.model.js";
import handleAsync from "../../shared/utils/handleAsync.js";
import createResponse from "../../shared/utils/createResponse.js";

// 1. Tạo danh mục mới
export const createCategory = handleAsync(async (req, res) => {
  const category = await Category.create(req.body);
  // Sử dụng đúng cấu trúc hàm của bạn: createResponse(res, status, message, data)
  createResponse(res, 201, "Thêm danh mục mới thành công!", category);
});

// 2. Lấy danh sách danh mục
export const getCategories = handleAsync(async (req, res) => {
  const categories = await Category.find();
  // Không cần res.status().json() ở ngoài vì hàm createResponse đã làm việc đó
  createResponse(res, 200, "Lấy danh sách danh mục thành công!", categories);
});

// 3. Lấy chi tiết một danh mục
export const getCategoryById = handleAsync(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return createResponse(res, 404, "Không tìm thấy danh mục này!");
  }

  createResponse(res, 200, "Lấy thông tin danh mục thành công!", category);
});

// 4. Cập nhật danh mục
export const updateCategory = handleAsync(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return createResponse(res, 404, "Không tìm thấy danh mục để cập nhật!");
  }

  createResponse(res, 200, "Cập nhật danh mục thành công!", category);
});

// 5. Xóa danh mục
export const deleteCategory = handleAsync(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return createResponse(res, 404, "Không tìm thấy danh mục để xóa!");
  }

  createResponse(res, 200, "Đã xóa danh mục thành công!");
});