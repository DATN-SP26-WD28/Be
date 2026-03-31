import mongoose from "mongoose";

const feedbackResponseSchema = new mongoose.Schema(
  {
    feedback_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feedback",
      required: true,
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const FeedbackResponse = mongoose.model("FeedbackResponse", feedbackResponseSchema);
export default FeedbackResponse;