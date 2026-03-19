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

dishesRouter.post("/", createDish);
dishesRouter.get("/", getDishes);
dishesRouter.get("/deleted", getDeletedDishes);
dishesRouter.get("/:id", getDishById);
dishesRouter.put("/:id", updateDish);
dishesRouter.put("/:id/restore", restoreDish);
dishesRouter.delete("/:id", deleteDish);

export default dishesRouter;
