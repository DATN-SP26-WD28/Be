import express from "express";
import * as responseController from "./feedback_responses.controller.js";

const router = express.Router();

router.post("/", responseController.replyFeedback);