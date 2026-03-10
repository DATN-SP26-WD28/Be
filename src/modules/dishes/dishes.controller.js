import Dish from "./dishes.model.js";
import handleAsync from "../../shared/utils/handleAsync.js";
import createResponse from "../../shared/utils/createResponse.js";

export const createDish = handleAsync(async (req, res) => {
  const dish = await Dish.create(req.body);
  res.status(201).json(createResponse(dish));
});

export const getDishes = handleAsync(async (req, res) => {
  const dishes = await Dish.find().populate("category");
  res.status(200).json(createResponse(dishes));
});

export const getDishById = handleAsync(async (req, res) => {
  const dish = await Dish.findById(req.params.id).populate("category");
  res.status(200).json(createResponse(dish));
});

export const updateDish = handleAsync(async (req, res) => {
  const dish = await Dish.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.status(200).json(createResponse(dish));
});

export const deleteDish = handleAsync(async (req, res) => {
  await Dish.findByIdAndDelete(req.params.id);
  res.status(204).json();
});
