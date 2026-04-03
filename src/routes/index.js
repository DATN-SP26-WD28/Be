
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
import staffRouter from "../modules/staff/staff.routes.js";
import userRouter from "../modules/user/user.routes.js";
import guestRouter from "../modules/guest/Guest.routes.js";
import paymenRouter from "../modules/payment/payments.routes.js";
import feedbackRouter from "../modules/feedback/feedbacks.routes.js";
import feedbackResponseRouter from "../modules/feedback_responses/feedback_responses.routes.js"; 
import transactionRoutes from "../modules/transactions/transactions.routes.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/staff", staffRouter); // Quản lý nhân viên
router.use("/users", userRouter); // Quản lý người dùng chung
router.use("/tables", tablesRouter);
router.use("/categories", categoriesRouter);
router.use("/dishes", dishesRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/order-items", orderItemsRouter);
router.use("/order-item-history", orderItemStatusHistoryRouter);
router.use("/order-status-history", OrderStatusHistoryRouter);
router.use("/invoice", invoicesRouter);
router.use("/payments", paymenRouter);
router.use("/guest", guestRouter);
router.use("/feedbacks", feedbackRouter);
router.use("/feedback-responses", feedbackResponseRouter);
router.use("/transactions", transactionRoutes);

export default router;
