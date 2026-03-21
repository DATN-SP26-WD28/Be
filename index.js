import express from "express";
import router from "./src/routes/index.js";
import connectDB from "./src/shared/configs/connectDB.js";
import { HOST, PORT } from "./src/shared/configs/dotenvConfig.js";
import notFoundRequest from "./src/shared/middlewares/notFoundRequest.js";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser"
 import 'dotenv/config'

const app = express();
app.use(cookieParser())
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all localhost origins for development
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map(error => error.message)
      .join(', ');
    
    return res.status(400).json({
      status: 'error',
      message: messages || 'Dữ liệu không hợp lệ',
      errors: err.errors
    });
  }

  // Handle Mongoose Duplicate Key Errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      status: 'error',
      message: `${field} đã tồn tại`
    });
  }

  // Default error handler
  const statusCode = err.status || 500;
  
  res.status(statusCode).json({
    status: statusCode >= 400 && statusCode < 500 ? 'error' : 'error',
    message: err.message || "Lỗi cơ sở dữ liệu",
    err: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on ${HOST}:${PORT}`);
});
