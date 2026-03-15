
import Router from "express";
import authRouter from "../modules/auth/auth.routes.js";
import tablesRouter from "../modules/tables/tables.routes.js";
import categoriesRouter from "../modules/categories/categories.routes.js";
import dishesRouter from "../modules/dishes/dishes.routes.js";
import cartRouter from "../modules/cart/cart.routes.js";
import ordersRouter from "../modules/orders/orders.routes.js";
import orderItemsRouter from "../modules/order_items/order_items.routes.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/tables", tablesRouter);
router.use("/categories", categoriesRouter);
router.use("/dishes", dishesRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/order-items", orderItemsRouter);

export default router;
