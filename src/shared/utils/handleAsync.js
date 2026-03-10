const handleAsync = (fn) => (req, res, next) => {
  // Chỉ thực thi hàm, nếu có lỗi hệ thống (crash) thì in ra log
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error("CRITICAL ERROR:", err);
    // Nếu chưa gửi response thì mới gửi lỗi 500
    if (!res.headersSent) {
        res.status(500).json({ message: "Internal Server Error", err });
    }
  });
};

export default handleAsync;