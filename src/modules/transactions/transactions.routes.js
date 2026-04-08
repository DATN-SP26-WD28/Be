import express from "express";
import * as transactionController from "./transactions.controller.js";

const router = express.Router();

router.post("/", transactionController.createTransaction);
router.get("/", transactionController.getTransactionHistory);
router.get("/invoice/:invoiceId", transactionController.getTransactionByInvoice);
router.put("/:id", transactionController.updateTransactionStatus);

export default router;