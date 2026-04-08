import express from "express";
import * as responseController from "./feedback_responses.controller.js";

const router = express.Router();

router.post("/", responseController.replyFeedback);
router.get("/feedback/:feedbackId", responseController.getResponseByFeedback);
router.put("/:id", responseController.updateResponse);
router.delete("/:id", responseController.deleteResponse);

export default router;