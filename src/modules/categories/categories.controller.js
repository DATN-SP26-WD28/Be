import Category from "./categories.model.js";
import handleAsync from "../../shared/utils/handleAsync.js";
import createResponse from "../../shared/utils/createResponse.js";

export const createCategory = handleAsync(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json(createResponse(category));
});

export const getCategories = handleAsync(async (req, res) => {
  const categories = await Category.find();
  res.status(200).json(createResponse(categories));
});

export const getCategoryById = handleAsync(async (req, res) => {
  const category = await Category.findById(req.params.id);
  res.status(200).json(createResponse(category));
});

export const updateCategory = handleAsync(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.status(200).json(createResponse(category));
});

export const deleteCategory = handleAsync(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.status(204).json();
});
