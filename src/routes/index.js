import Router from "express";
import authRouter from "../modules/auth/auth.routes.js";
import tablesRouter from "../modules/tables/tables.routes.js";

const router = Router();

router.use("/auth",authRouter)
router.use("/tables",tablesRouter)

export default router;
