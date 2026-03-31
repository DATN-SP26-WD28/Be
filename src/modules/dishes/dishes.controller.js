import Dish from "./dishes.model.js";
import handleAsync from "../../shared/utils/handleAsync.js";
import createResponse from "../../shared/utils/createResponse.js";

// 1. Tạo món ăn mới
export const createDish = handleAsync(async (req, res) => {
  const dish = await Dish.create(req.body);
  // Cấu trúc: createResponse(res, status, message, data)
  createResponse(res, 201, "Thêm món ăn mới thành công!", dish);
});

// 2. Lấy danh sách món ăn
export const getDishes = handleAsync(async (req, res) => {
  const dishes = await Dish.find().populate("category_id");
  createResponse(res, 200, "Lấy danh sách món ăn thành công!", dishes);
});

// 3. Lấy chi tiết một món ăn
export const getDishById = handleAsync(async (req, res) => {
  const dish = await Dish.findById(req.params.id).populate("category_id");

  if (!dish) {
    return createResponse(res, 404, "Không tìm thấy món ăn này!");
  }

  createResponse(res, 200, "Lấy thông tin món ăn thành công!", dish);
});

// 4. Cập nhật món ăn
export const updateDish = handleAsync(async (req, res) => {
  const dish = await Dish.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true, // Đảm bảo dữ liệu cập nhật vẫn tuân thủ Schema
  });

  if (!dish) {
    return createResponse(res, 404, "Không tìm thấy món ăn để cập nhật!");
  }

  createResponse(res, 200, "Cập nhật món ăn thành công!", dish);
});

// 5. Xóa món ăn
export const deleteDish = handleAsync(async (req, res) => {
  const dish = await Dish.findByIdAndDelete(req.params.id);

  if (!dish) {
    return createResponse(res, 404, "Không tìm thấy món ăn để xóa!");
  }

  // Thường xóa thành công có thể dùng 200 kèm message hoặc 204 (No Content)
  createResponse(res, 200, "Đã xóa món ăn thành công!");
});