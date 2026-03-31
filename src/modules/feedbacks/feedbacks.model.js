import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    dish_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dish",
    },
    type: {
      type: String,
      trim: true,
      maxLength: 20, // Ví dụ: 'order', 'dish', 'service'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      maxLength: 255,
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;