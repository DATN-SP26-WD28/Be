import Router from "express";
import authRouter from "../modules/auth/auth.routes.js";
import tablesRouter from "../modules/tables/tables.routes.js";
import categoriesRouter from "../modules/categories/categories.routes.js";
import dishesRouter from "../modules/dishes/dishes.routes.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/tables", tablesRouter);
router.use("/categories", categoriesRouter);
router.use("/dishes", dishesRouter);

export default router;
