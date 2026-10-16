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
  title: "Xác minh email",
  ready: "Bấm xác minh để xác nhận địa chỉ email bằng liên kết này.",
  verify: "Xác minh email",
  pending: "Đang xác minh…",
  verified: "Email đã được xác minh.",
  verifiedDescription: "Bạn có thể đăng nhập để tiếp tục sử dụng tài khoản.",
  invalidLink:
    "Liên kết xác minh không hợp lệ, đã hết hạn hoặc đã được sử dụng. Bạn có thể đăng nhập nếu đã xác minh, hoặc yêu cầu liên kết mới.",
  retry: "Thử xác minh lại",
  login: "Đăng nhập",
  recover: "Yêu cầu liên kết mới",
  uncertain:
    "Không nhận được kết quả xác minh. Bạn có thể thử lại; nếu liên kết đã được sử dụng, hãy đăng nhập hoặc yêu cầu liên kết mới.",
  unexpected: "Chưa xác nhận được email đã được xác minh. Vui lòng thử lại sau.",
  rateLimited: "Có quá nhiều yêu cầu. Vui lòng đợi rồi thử lại.",
  resendAccepted:
    "Yêu cầu đã được tiếp nhận. Nếu tài khoản cần xác minh, bạn sẽ nhận được email hướng dẫn.",
} as const;

/** Token theo VerifyEmailRequest C#: không sửa bytes của proof opaque. */
export const emailVerificationTokenSchema = z
  .string()
  .min(1, "Thiếu token xác minh.")
  .max(256, "Token xác minh không hợp lệ.")
  .refine((token) => token.trim().length > 0, "Thiếu token xác minh.");
