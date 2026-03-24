import mongoose from "mongoose";
import { DB_URI } from "./dotenvConfig.js";

function connectDB() {
  mongoose
    .connect(DB_URI)
    .then(() => {
      console.log(`Connected database successfully!`);
    })
    .catch((error) => {
      console.error(`Connect database failed!`, error.message || error);
      process.exit(1);
    });
}
export default connectDB;
