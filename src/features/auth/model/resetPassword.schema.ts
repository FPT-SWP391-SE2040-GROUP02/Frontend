import { APP_MESSAGES } from "@/shared/constants";
import { z } from "zod";
import { NEW_PASSWORD_HINT, newPasswordSchema } from "./password.schema";

/** Nội dung đặt lại mật khẩu theo Backend; không tự cấp phiên. */
export const RESET_PASSWORD_CONTENT = {
  title: "Đặt mật khẩu mới",
  description: "Chọn mật khẩu mới cho tài khoản của bạn.",
  sideTitle: "Trở lại với những điều quan trọng.",
  sideDescription:
    "Dùng mật khẩu riêng cho tài khoản. Không chia sẻ liên kết khôi phục hoặc mã xác nhận.",
  password: "Mật khẩu mới",
  confirm: "Nhập lại mật khẩu mới",
  mismatch: APP_MESSAGES.VALIDATION.PASSWORD_NOT_MATCH,
  hint: NEW_PASSWORD_HINT,
  show: "Hiện mật khẩu",
  hide: "Ẩn mật khẩu",
  submit: "Đặt lại mật khẩu",
  completed: "Đã đặt lại mật khẩu",
  completedDetail:
    "Mật khẩu đã được thay đổi. Các phiên làm mới đã bị thu hồi; đăng nhập lại để tiếp tục.",
  expired: "Liên kết đã hết hạn",
  expiredDetail: "Yêu cầu một liên kết khôi phục mới và sử dụng liên kết mới nhất trong email.",
  invalid: "Liên kết không hợp lệ",
  invalidDetail:
    "Liên kết có thể thiếu mã xác nhận hoặc đã được sử dụng. Yêu cầu gửi lại để tiếp tục.",
  request: "Yêu cầu liên kết mới",
  login: "Quay lại đăng nhập",
} as const;

/** Schema khôi phục dùng quy tắc mật khẩu mới, độc lập validation đăng nhập. */
export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema.max(128, "Mật khẩu không được vượt quá 128 ký tự."),
    confirmPassword: z.string().min(1, APP_MESSAGES.VALIDATION.REQUIRED("Xác nhận mật khẩu")),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: RESET_PASSWORD_CONTENT.mismatch,
    path: ["confirmPassword"],
  });

/** Dữ liệu form chỉ được giữ trong RAM; không chứa DTO token khôi phục. */
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Opaque token trong link BE, giữ nguyên bytes; page từ chối query trùng token. */
export const passwordResetTokenSchema = z
  .string()
  .min(1)
  .max(256)
  .refine((value) => value.trim().length > 0);

/** DTO wire đúng tên field Backend, không lưu token trong form/cache. */
export const resetPasswordRequestSchema = z
  .object({
    token: passwordResetTokenSchema,
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, { path: ["confirmPassword"] });
