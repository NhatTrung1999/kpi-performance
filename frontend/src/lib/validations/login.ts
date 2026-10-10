import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email công ty hoặc mã nhân viên."),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu.")
    .min(8, "Mật khẩu phải có tối thiểu 8 ký tự."),
  remember: z.boolean(),
});

export type LoginValues = z.infer<typeof loginSchema>;
