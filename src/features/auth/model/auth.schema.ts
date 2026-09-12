import { z } from "zod";
import { APP_MESSAGES } from "@/shared/constants";

/**
 * @description Zod Schema kiểm tra hợp lệ dữ liệu Form Đăng nhập.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Email"))
    .email(APP_MESSAGES.VALIDATION.EMAIL),
  password: z
    .string()
    .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Mật khẩu"))
    .min(8, APP_MESSAGES.VALIDATION.MIN_LENGTH("Mật khẩu", 8)),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * @description Zod Schema kiểm tra hợp lệ dữ liệu Form Đăng ký.
 */
export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Họ và tên"))
      .min(2, APP_MESSAGES.VALIDATION.MIN_LENGTH("Họ và tên", 2)),
    email: z
      .string()
      .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Email"))
      .email(APP_MESSAGES.VALIDATION.EMAIL),
    password: z
      .string()
      .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Mật khẩu"))
      .min(8, APP_MESSAGES.VALIDATION.MIN_LENGTH("Mật khẩu", 8)),
    confirmPassword: z
      .string()
      .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Xác nhận mật khẩu")),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * @description Zod Schema kiểm tra mã OTP 6 số.
 */
export const otpSchema = z.object({
  otpCode: z
    .string()
    .length(6, "Mã OTP phải bao gồm chính xác 6 chữ số.")
    .regex(/^\d+$/, "Mã OTP chỉ được chứa chữ số."),
});

export type OtpInput = z.infer<typeof otpSchema>;
