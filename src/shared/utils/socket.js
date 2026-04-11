
let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

export const getIO = () => {
  if (!ioInstance) {
    console.warn("⚠️ Cảnh báo: Socket.io chưa được khởi tạo! Hãy kiểm tra lại file server.js");
  }
  return ioInstance;
};