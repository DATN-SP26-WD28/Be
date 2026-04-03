import express from "express";
import * as transactionController from "./transactions.controller.js";

const router = express.Router();

router.post("/", transactionController.createTransaction);
router.get("/", transactionController.getTransactionHistory);
router.get("/invoice/:invoiceId", transactionController.getTransactionByInvoice);
export default router;