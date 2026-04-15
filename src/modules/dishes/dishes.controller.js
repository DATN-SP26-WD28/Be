import Dish from "./dishes.model.js";
import handleAsync from "../../shared/utils/handleAsync.js";
import createResponse from "../../shared/utils/createResponse.js";

export const createDish = handleAsync(async (req, res) => {
  const dish = await Dish.create(req.body);
  createResponse(res, 201, "Thêm món ăn mới thành công!", dish);
});

export const getDishes = handleAsync(async (req, res) => {
  const { category_id } = req.query;
  const filter = { deleted_at: null };
  if (category_id) filter.category_id = category_id;

  const dishes = await Dish.find(filter).populate("category_id");
  createResponse(res, 200, "Lấy danh sách món ăn thành công!", dishes);
});

export const getDeletedDishes = handleAsync(async (req, res) => {
  const dishes = await Dish.find({ deleted_at: { $ne: null } });
  createResponse(res, 200, "Lấy danh sách món đã xóa!", dishes);
});

export const getDishById = handleAsync(async (req, res) => {
  const dish = await Dish.findOne({
    _id: req.params.id,
    deleted_at: null,
  }).populate("category_id");

  if (!dish) {
    return createResponse(res, 404, "Không tìm thấy món ăn này!");
  }

  createResponse(res, 200, "Lấy thông tin món ăn thành công!", dish);
});

export const updateDish = handleAsync(async (req, res) => {
  const dish = await Dish.findOneAndUpdate(
    { _id: req.params.id, deleted_at: null },
    req.body,
    { new: true, runValidators: true },
  );

  if (!dish) {
    return createResponse(res, 404, "Không tìm thấy món ăn để cập nhật!");
  }

  createResponse(res, 200, "Cập nhật món ăn thành công!", dish);
});

export const deleteDish = handleAsync(async (req, res) => {
  const dish = await Dish.findOneAndUpdate(
    { _id: req.params.id, deleted_at: null },
    { deleted_at: new Date() },
    { new: true },
  );

  if (!dish) {
    return createResponse(res, 404, "Không tìm thấy món ăn để xóa!");
  }

  createResponse(res, 200, "Đã xóa món ăn thành công!");
});

export const restoreDish = handleAsync(async (req, res) => {
  const dish = await Dish.findOneAndUpdate(
    { _id: req.params.id, deleted_at: { $ne: null } },
    { deleted_at: null },
    { new: true },
  );

  if (!dish) {
    return createResponse(res, 404, "Không tìm thấy món ăn để khôi phục!");
  }

  createResponse(res, 200, "Khôi phục món ăn thành công!", dish);
});
