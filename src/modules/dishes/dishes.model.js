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
    price: { type: mongoose.Schema.Types.Decimal128, required: true },
    status: {
      type: String,
      enum: ['available', 'out_of_stock'],
      default: 'available',
    },
    image_url: { type: String, maxLength: 255 },
  },
  { timestamps: true },
);

const Dish = mongoose.model("Dish", dishSchema);
export default Dish;
