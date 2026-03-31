import z from "zod";

// Schema cho Đăng ký (Register)
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(30, "Tên đăng nhập không quá 30 ký tự"),
  
  email: z
    .string()
    .email("Email không đúng định dạng"),
  
  phone: z
    .string()
    .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/g, "Số điện thoại Việt Nam không hợp lệ"),
  
  password: z
    .string()
    .min(6, "Mật khẩu phải từ 6 ký tự trở lên"),
  
  role: z
    .enum(['customer', 'waiter', 'cashier', 'chef', 'admin'])
    .optional() // Mặc định là customer nếu không gửi
});

// Schema cho Đăng nhập (Login)
export const loginSchema = z.object({
  email: z
    .string()
    .email("Email không hợp lệ"),
  
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
});