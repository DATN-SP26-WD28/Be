import express from "express";
import * as transactionController from "./transactions.controller.js";

const router = express.Router();

router.post("/", transactionController.createTransaction);

export default router;