import express from "express";
import * as feedbackController from "./feedbacks.controller.js";

const router = express.Router();

router.post("/", feedbackController.createFeedback);
router.get("/", feedbackController.getAllFeedbacks);
router.put("/:id", feedbackController.updateFeedbackStatus);
router.delete("/:id", feedbackController.deleteFeedback);

export default router;