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
  const { includeDeleted = false, includeHidden = false } = req.query;
  let filter = { _id: req.params.id, isDeleted: false };
  if (includeDeleted === "true") {
    filter = { _id: req.params.id };
  }
  if (includeHidden !== "true") {
    filter.isVisible = true;
  }
  const dish = await Dish.findOne(filter).populate("category_id");

  if (!dish) {
    return createResponse(res, 404, "Không tìm thấy món ăn này!");
  }

  createResponse(res, 200, "Lấy thông tin món ăn thành công!", dish);
});

// 4. Cập nhật món ăn
export const updateDish = handleAsync(async (req, res) => {
  const dish = await Dish.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
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

// 5. Xóa món ăn (xóa mềm)
export const deleteDish = handleAsync(async (req, res) => {
  const dish = await Dish.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  );

  if (!dish) {
    return createResponse(res, 404, "Không tìm thấy món ăn để xóa!");
  }

  createResponse(res, 200, "Đã xóa món ăn thành công!");
});

// 6. Khôi phục món ăn
export const restoreDish = handleAsync(async (req, res) => {
  const dish = await Dish.findOneAndUpdate(
    { _id: req.params.id, isDeleted: true },
    { isDeleted: false, $unset: { deletedAt: 1 } },
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

// 7. Ẩn/hiện món ăn
export const toggleVisibility = handleAsync(async (req, res) => {
  const dish = await Dish.findOne({ _id: req.params.id, isDeleted: false });

  if (!dish) {
    return createResponse(res, 404, "Không tìm thấy món ăn!");
  }

  dish.isVisible = !dish.isVisible;
  await dish.save();

  createResponse(
    res,
    200,
    `Đã ${dish.isVisible ? "hiện" : "ẩn"} món ăn thành công!`,
    dish,
  );
});
