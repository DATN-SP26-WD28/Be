import express from "express";
import {
  createDish,
  getDishes,
  getDishById,
  updateDish,
  deleteDish,
  restoreDish,
  toggleVisibility,
} from "./dishes.controller.js";

const dishesRouter = express.Router();

dishesRouter.post("/", createDish);
dishesRouter.get("/", getDishes);
dishesRouter.get("/:id", getDishById);
dishesRouter.put("/:id", updateDish);
dishesRouter.delete("/:id", deleteDish);
dishesRouter.patch("/:id/restore", restoreDish);
dishesRouter.patch("/:id/toggle-visibility", toggleVisibility);

export default dishesRouter;
