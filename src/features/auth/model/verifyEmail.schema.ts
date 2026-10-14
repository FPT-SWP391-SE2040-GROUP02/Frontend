import { APP_MESSAGES } from "@/shared/constants";
import { z } from "zod";

/**
 * @description Kiểm tra email trước khi cho phép gửi lại liên kết xác minh.
 */
export const verificationEmailSchema = z
  .string()
  .trim()
  .min(1, APP_MESSAGES.VALIDATION.REQUIRED("Email"))
  .email(APP_MESSAGES.VALIDATION.INVALID_EMAIL);

/**
 * @description Nội dung phản hồi gửi lại liên kết xác minh email.
 */
export const VERIFY_EMAIL_CONTENT = {
  resendAccepted:
    "Yêu cầu đã được tiếp nhận. Nếu tài khoản cần xác minh, bạn sẽ nhận được email hướng dẫn.",
} as const;

/** Token theo VerifyEmailRequest C#: không sửa bytes của proof opaque. */
export const emailVerificationTokenSchema = z
  .string()
  .min(1, "Thiếu token xác minh.")
  .max(256, "Token xác minh không hợp lệ.")
  .refine((token) => token.trim().length > 0, "Thiếu token xác minh.");
