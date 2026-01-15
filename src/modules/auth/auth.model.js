import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
   
  },
  { timestamps: true, versionKey: false }
);

const User = mongoose.model("User", userSchema);

export default User;
