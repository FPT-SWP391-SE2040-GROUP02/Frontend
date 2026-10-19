import { APP_MESSAGES } from "@/shared/constants";
import { z } from "zod";
import { newPasswordSchema } from "./password.schema";

/**
 * @description Zod Schema kiểm tra hợp lệ dữ liệu Form Đăng nhập.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Email"))
    .email(APP_MESSAGES.VALIDATION.INVALID_EMAIL),
  // Password hiện có được BE xác thực; không áp policy tạo mật khẩu mới.
  password: z.string().min(1, APP_MESSAGES.VALIDATION.REQUIRED("Mật khẩu")),
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
      .trim()
      .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Họ và tên"))
      .min(2, APP_MESSAGES.VALIDATION.MIN_LENGTH("Họ và tên", 2))
      .max(200, "Họ và tên không được vượt quá 200 ký tự."),
    email: z
      .string()
      .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Email"))
      .email(APP_MESSAGES.VALIDATION.INVALID_EMAIL)
      .max(256, "Email không được vượt quá 256 ký tự."),
    password: newPasswordSchema.max(128, "Mật khẩu không được vượt quá 128 ký tự."),
    confirmPassword: z.string().min(1, APP_MESSAGES.VALIDATION.REQUIRED("Xác nhận mật khẩu")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: APP_MESSAGES.VALIDATION.PASSWORD_NOT_MATCH,
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

/**
 * @description Zod Schema kiểm tra dữ liệu xác nhận mật khẩu để liên kết Google (Mockup 5).
 */
export const linkGoogleSchema = z.object({
  password: z
    .string()
    .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Mật khẩu hiện có"))
    .max(128, APP_MESSAGES.VALIDATION.MAX_LENGTH("Mật khẩu", 128)),
});

export type LinkGoogleInput = z.infer<typeof linkGoogleSchema>;

/**
 * @description Zod Schema kiểm tra mã xác thực 2 bước 6 chữ số (Mockup 7).
 */
export const twoFactorSchema = z.object({
  code: z
    .string()
    .length(6, "Mã xác thực gồm chính xác 6 chữ số.")
    .regex(/^\d{6}$/, "Mã xác thực chỉ chứa chữ số từ 0 đến 9."),
  rememberDevice: z.boolean().optional(),
});

export type TwoFactorInput = z.infer<typeof twoFactorSchema>;
