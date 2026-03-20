import Dish from "./dishes.model.js";
import { OrderItem } from "../order_items/order_items.model.js";
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
  const dishes = await Dish.find({ is_deleted: false }).populate("category_id");
  createResponse(res, 200, "Lấy danh sách món ăn thành công!", dishes);
});

// 2.1. Lấy danh sách món ăn đã xóa
export const getDeletedDishes = handleAsync(async (req, res) => {
  const dishes = await Dish.find({ is_deleted: true }).populate("category_id");
  createResponse(res, 200, "Lấy danh sách món ăn đã xóa thành công!", dishes);
});

// 3. Lấy chi tiết một món ăn
export const getDishById = handleAsync(async (req, res) => {
  const dish = await Dish.findOne({
    _id: req.params.id,
    is_deleted: false,
  }).populate("category_id");

  if (!dish) {
    return createResponse(res, 404, "Không tìm thấy món ăn này!");
  }

  createResponse(res, 200, "Lấy thông tin món ăn thành công!", dish);
});

// 4. Cập nhật món ăn
export const updateDish = handleAsync(async (req, res) => {
  const dish = await Dish.findOneAndUpdate(
    { _id: req.params.id, is_deleted: false },
    req.body,
    {
      new: true,
      runValidators: true, // Đảm bảo dữ liệu cập nhật vẫn tuân thủ Schema
    },
  );

  if (!dish) {
    return createResponse(res, 404, "Không tìm thấy món ăn để cập nhật!");
  }

  createResponse(res, 200, "Cập nhật món ăn thành công!", dish);
});

// 5. Xóa món ăn (soft delete)
export const deleteDish = handleAsync(async (req, res) => {
  // Kiểm tra xem món ăn có trong đơn hàng nào không (có doanh thu)
  const hasOrders = await OrderItem.findOne({ dish_id: req.params.id });
  if (hasOrders) {
    return createResponse(
      res,
      400,
      "Không thể xóa món ăn này vì đã có doanh thu!",
    );
  }

  const dish = await Dish.findOneAndUpdate(
    { _id: req.params.id, is_deleted: false },
    { is_deleted: true },
    { new: true },
  );

  if (!dish) {
    return createResponse(res, 404, "Không tìm thấy món ăn để xóa!");
  }

  createResponse(res, 200, "Xóa món ăn thành công!", dish);
});

// 6. Khôi phục món ăn
export const restoreDish = handleAsync(async (req, res) => {
  const dish = await Dish.findOneAndUpdate(
    { _id: req.params.id, is_deleted: true },
    { is_deleted: false },
    { new: true },
  );

  if (!dish) {
    return createResponse(
      res,
      404,
      "Không tìm thấy món ăn đã xóa để khôi phục!",
    );
  }

  createResponse(res, 200, "Khôi phục món ăn thành công!", dish);
});
