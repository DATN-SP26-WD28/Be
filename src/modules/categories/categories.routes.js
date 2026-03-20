import express from "express";
import {
  createCategory,
  getCategories,
  getDeletedCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  restoreCategory,
} from "./categories.controller.js";

const categoriesRouter = express.Router();

categoriesRouter.post("/", createCategory);
categoriesRouter.get("/", getCategories);
categoriesRouter.get("/deleted", getDeletedCategories);
categoriesRouter.get("/:id", getCategoryById);
categoriesRouter.put("/:id", updateCategory);
categoriesRouter.put("/:id/restore", restoreCategory);
categoriesRouter.delete("/:id", deleteCategory);

export default categoriesRouter;
