import dotenv from "dotenv";

dotenv.config({
  // path: []
  // encoding: "utf8"
  // override: true,
});

export const HOST = process.env.HOST || "http://localhost";
export const PORT = parseInt(process.env.PORT, 10) || 8888;
export const DB_URI = process.env.DB_URI || "mongodb://localhost:27017/DATN";
export const JWT_SECRET = process.env.JWT_SECRET || "tkhanh";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
export const EMAIL_USER = process.env.EMAIL_USER || "";
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "";
