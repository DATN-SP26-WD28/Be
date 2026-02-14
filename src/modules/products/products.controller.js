import Product from "./products.model.js";
import handleAsync from "../../shared/utils/handleAsync.js";
import createResponse from "../../shared/utils/createResponse.js";

export const createProduct = handleAsync(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(createResponse(product));
});

export const getProducts = handleAsync(async (req, res) => {
  const products = await Product.find().populate("category");
  res.status(200).json(createResponse(products));
});

export const getProductById = handleAsync(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");
  res.status(200).json(createResponse(product));
});

export const updateProduct = handleAsync(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.status(200).json(createResponse(product));
});

export const deleteProduct = handleAsync(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.status(204).json();
});
