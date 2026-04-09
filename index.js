import express from "express";
import http from "http";
import { Server } from "socket.io";
import router from "./src/routes/index.js";
import connectDB from "./src/shared/configs/connectDB.js";
import { HOST, PORT } from "./src/shared/configs/dotenvConfig.js";
import notFoundRequest from "./src/shared/middlewares/notFoundRequest.js";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { setIO } from "./src/shared/utils/socket.js";
import { SOCKET_EVENTS, SOCKET_ROOMS } from "./src/shared/constants/socket.constants.js";
import 'dotenv/config';

const app = express();
const server = http.createServer(app);

// 1. Middlewares cơ bản
app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));

// 2. Cấu hình CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép tất cả các nguồn localhost để dev thuận tiện
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('CORS: Nguồn truy cập không được phép!'));
      }
    },
    credentials: true,
  })
);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('CORS: Nguồn truy cập không được phép!'));
      }
    },
    credentials: true,
  },
});

setIO(io);

io.on(SOCKET_EVENTS.CONNECT, (socket) => {
  console.info(`[socket] connected: ${socket.id}`);

  socket.on(SOCKET_EVENTS.JOIN_TABLE, (tableId) => {
    if (!tableId) return;
    socket.join(SOCKET_ROOMS.table(tableId));
  });

  socket.on(SOCKET_EVENTS.JOIN_ORDER, (orderId) => {
    if (!orderId) return;
    socket.join(SOCKET_ROOMS.order(orderId));
  });

  socket.on(SOCKET_EVENTS.JOIN_ADMIN_ORDERS, () => {
    socket.join(SOCKET_ROOMS.ADMIN_ORDERS);
  });

  socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
    console.info(`[socket] disconnected: ${socket.id} (${reason})`);
  });
});

// 3. Kết nối Database
connectDB();

// 4. Định nghĩa Routes
app.use("/", router);

// 5. Xử lý Route không tồn tại (404 Not Found)
app.use(notFoundRequest);

// 6. MIDDLEWARE XỬ LÝ LỖI TẬP TRUNG (QUAN TRỌNG)
app.use((err, req, res, next) => {
  // Lấy mã lỗi từ err.statusCode (từ createError) hoặc err.status hoặc mặc định 500
  const statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Lỗi hệ thống (Internal Server Error)";

  // Log lỗi chi tiết ra terminal để bạn dễ debug
  console.error(`>>> [ERROR ${statusCode}]:`, message);

  // Xử lý riêng lỗi Validation của Mongoose (Dữ liệu gửi lên sai Schema)
  if (err.name === 'ValidationError') {
    const validationMessages = Object.values(err.errors)
      .map(error => error.message)
      .join(', ');

    return res.status(400).json({
      status: 'error',
      message: validationMessages || 'Dữ liệu không hợp lệ',
      errors: err.errors
    });
  }

  // Xử lý lỗi trùng lặp dữ liệu (Unique Key - lỗi 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      status: 'error',
      message: `${field} đã tồn tại trong hệ thống`
    });
  }

  // Xử lý lỗi JWT hết hạn (Khớp với vấn đề Token lúc đầu của bạn)
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      status: 'error',
      message: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!"
    });
  }

  // Phản hồi lỗi cuối cùng về Frontend (Đảm bảo statusCode luôn là số nguyên)
  res.status(statusCode).json({
    status: 'error',
    message: message,
    // Chỉ hiện stack trace khi đang ở môi trường phát triển (development)
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 7. Khởi động Server
server.listen(PORT, () => {
  console.log(`🚀 Roosta Server is running on: ${HOST}:${PORT}`);
});