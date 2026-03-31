import { z } from 'zod'

const validBodyRequest = (schema) => async (req, res, next) => {
  try {
    const data = await schema.parseAsync(req.body);
    req.body = data;
    next(); // <--- Phải có dòng này để chạy tiếp sang Controller
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((item) => `${item.path.join(".")}: ${item.message}`);
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        errors: errors,
      });
    }
    next(error);
  }
};
export default validBodyRequest