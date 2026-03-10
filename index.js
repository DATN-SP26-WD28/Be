import express from "express";
import router from "./src/routes/index.js";
import connectDB from "./src/shared/configs/connectDB.js";
import { HOST, PORT } from "./src/shared/configs/dotenvConfig.js";
import notFoundRequest from "./src/shared/middlewares/notFoundRequest.js";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser"


const app = express();
app.use(cookieParser())
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(morgan("dev"));

connectDB();

app.use("/", router);


// * handle Notfound Request
app.use(notFoundRequest);

// PHẢI CÓ ĐỦ 4 THAM SỐ: err, req, res, next
app.use((err, req, res, next) => {
  console.error(">>> LOG LỖI:", err); 

  // Lấy status từ hàm createError cũ của bạn hoặc mặc định 500
  const statusCode = err.status || 500;
  
  // Trả về JSON cho Postman
  res.status(statusCode).json({
    message: err.message || "Lỗi cơ sở dữ liệu",
    err: err.message || err // Trả về message để dễ đọc hơn
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on ${HOST}:${PORT}`);
});
