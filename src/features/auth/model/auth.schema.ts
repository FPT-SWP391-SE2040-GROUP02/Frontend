import { z } from "zod";
import { emailSchema, phoneSchema } from "@/shared/schemas";
import { APP_MESSAGES } from "@/shared/constants";

/**
 * @description Zod Schema kiểm tra hợp lệ thông tin form Đăng nhập.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, APP_MESSAGES.VALIDATION.MIN_LENGTH("Mật khẩu", 8)),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * @description Zod Schema kiểm tra hợp lệ thông tin form Đăng ký tài khoản mới.
 */
export const registerSchema = z
  .object({
    fullName: z.string().min(2, APP_MESSAGES.VALIDATION.MIN_LENGTH("Họ tên", 2)),
    email: emailSchema,
    phone: phoneSchema.optional(),
    password: z.string().min(6, APP_MESSAGES.VALIDATION.MIN_LENGTH("Mật khẩu", 6)),
    confirmPassword: z.string().min(1, APP_MESSAGES.VALIDATION.REQUIRED("Xác nhận mật khẩu")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: APP_MESSAGES.VALIDATION.PASSWORD_NOT_MATCH,
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
