
import Router from "express";
import authRouter from "../modules/auth/auth.routes.js";
import tablesRouter from "../modules/tables/tables.routes.js";
import categoriesRouter from "../modules/categories/categories.routes.js";
import dishesRouter from "../modules/dishes/dishes.routes.js";
import cartRouter from "../modules/cart/cart.routes.js";
import ordersRouter from "../modules/orders/orders.routes.js";
import orderItemsRouter from "../modules/order_items/order_items.routes.js";
import orderItemStatusHistoryRouter from "../modules/order_item_status_history/OrderItemStatusHistory.routes.js";
import OrderStatusHistoryRouter from "../modules/order_status_history/OrderStatusHistory.routes.js";
import invoicesRouter from "../modules/invoice/Invoice.routes.js";
import paymentRouter from "../modules/payment/payments.routes.js";
import userRouter from "../modules/user/user.routes.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/tables", tablesRouter);
router.use("/categories", categoriesRouter);
router.use("/dishes", dishesRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/order-items", orderItemsRouter);
router.use("/order-item-history", orderItemStatusHistoryRouter);
router.use("/order-status-history", OrderStatusHistoryRouter);
router.use("/invoice", invoicesRouter);
router.use("/payments", paymentRouter);

export default router;
