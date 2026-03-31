import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "./categories.controller.js";

const categoriesRouter = express.Router();

categoriesRouter.post("/", createCategory);
categoriesRouter.get("/", getCategories);
categoriesRouter.get("/:id", getCategoryById);
categoriesRouter.put("/:id", updateCategory);
categoriesRouter.delete("/:id", deleteCategory);

export default categoriesRouter;
