import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    category_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxLength: 100
    },
    description: {
      type: String
    },
    image_url: {
      type: String,
      maxLength: 255
    },
    status: {
      type: Boolean,
      default: true
    },
  },
  {
    timestamps: true,

  }
);

const Category = mongoose.model("Category", categorySchema);
export default Category;