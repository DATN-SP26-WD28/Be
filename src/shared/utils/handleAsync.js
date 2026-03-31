const handleAsync = (fn) => (req, res, next) => {
  // Chỉ thực thi hàm, nếu có lỗi (validation hoặc hệ thống) thì truyền sang error handler middleware
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error("ERROR:", err);
    // Truyền error sang error handling middleware
    next(err);
  });
};

export default handleAsync;