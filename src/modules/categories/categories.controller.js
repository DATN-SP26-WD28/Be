import Category from "./categories.model.js";
import Dish from "../dishes/dishes.model.js";
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
  const categories = await Category.find({ is_deleted: false });
  // Không cần res.status().json() ở ngoài vì hàm createResponse đã làm việc đó
  createResponse(res, 200, "Lấy danh sách danh mục thành công!", categories);
});

// 2.1. Lấy danh sách danh mục đã xóa
export const getDeletedCategories = handleAsync(async (req, res) => {
  const categories = await Category.find({ is_deleted: true });
  createResponse(
    res,
    200,
    "Lấy danh sách danh mục đã xóa thành công!",
    categories,
  );
});

// 3. Lấy chi tiết một danh mục
export const getCategoryById = handleAsync(async (req, res) => {
  const category = await Category.findOne({
    _id: req.params.id,
    is_deleted: false,
  });

  if (!category) {
    return createResponse(res, 404, "Không tìm thấy danh mục này!");
  }

  createResponse(res, 200, "Lấy thông tin danh mục thành công!", category);
});

// 4. Cập nhật danh mục
export const updateCategory = handleAsync(async (req, res) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, is_deleted: false },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!category) {
    return createResponse(res, 404, "Không tìm thấy danh mục để cập nhật!");
  }

  createResponse(res, 200, "Cập nhật danh mục thành công!", category);
});

// 5. Xóa danh mục (soft delete)
export const deleteCategory = handleAsync(async (req, res) => {
  // Kiểm tra xem danh mục có món ăn nào không
  const hasDishes = await Dish.findOne({
    category_id: req.params.id,
    is_deleted: false,
  });
  if (hasDishes) {
    return createResponse(
      res,
      400,
      "Không thể xóa danh mục này vì đang có món ăn!",
    );
  }

  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, is_deleted: false },
    { is_deleted: true },
    { new: true },
  );

  if (!category) {
    return createResponse(res, 404, "Không tìm thấy danh mục để xóa!");
  }

  createResponse(res, 200, "Xóa danh mục thành công!", category);
});

// 6. Khôi phục danh mục
export const restoreCategory = handleAsync(async (req, res) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );

  if (!category) {
    return createResponse(
      res,
      404,
      "Không tìm thấy danh mục đã xóa để khôi phục!",
    );
  }

  createResponse(res, 200, "Khôi phục danh mục thành công!", category);
});
