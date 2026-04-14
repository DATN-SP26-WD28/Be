import mongoose from "mongoose";

const dishSchema = new mongoose.Schema(
  {
    dish_name: { type: String, required: true, maxLength: 100 },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    description: { type: String },
    price: {
      type: Number,
      required: true,
      min: [0, "Giá tiền không thể nhỏ hơn 0"],
    },
    status: {
      type: String,
      enum: ["available", "out_of_stock"],
      default: "available",
    },
    image_url: { type: String, maxLength: 255 },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true },
);

const Dish = mongoose.model("Dish", dishSchema);
export default Dish;
