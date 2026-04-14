import express from "express";
import {
  createDish,
  getDishes,
  getDeletedDishes,
  getDishById,
  updateDish,
  deleteDish,
  restoreDish,
} from "./dishes.controller.js";

const dishesRouter = express.Router();

dishesRouter.get("/", getDishes);
dishesRouter.post("/", createDish);
dishesRouter.get("/deleted", getDeletedDishes);
dishesRouter.get("/:id", getDishById);
dishesRouter.put("/:id", updateDish);
dishesRouter.delete("/:id", deleteDish);
dishesRouter.patch("/:id/restore", restoreDish);

export default dishesRouter;
