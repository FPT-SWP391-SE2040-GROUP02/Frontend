import { APP_MESSAGES } from "@/shared/constants";
import { z } from "zod";
import { NEW_PASSWORD_HINT, newPasswordSchema } from "./password.schema";

/** Nội dung giao diện đặt lại mật khẩu, chưa tích hợp endpoint khôi phục. */
export const RESET_PASSWORD_CONTENT = {
  title: "Đặt mật khẩu mới",
  description: "Chọn mật khẩu mới cho tài khoản của bạn.",
  sideTitle: "Trở lại với những điều quan trọng.",
  sideDescription:
    "Dùng mật khẩu riêng cho tài khoản. Không chia sẻ liên kết khôi phục hoặc mã xác nhận.",
  preview: "Bản xem trước UI · Không thay đổi mật khẩu tài khoản.",
  password: "Mật khẩu mới",
  confirm: "Nhập lại mật khẩu mới",
  mismatch: APP_MESSAGES.VALIDATION.PASSWORD_NOT_MATCH,
  hint: NEW_PASSWORD_HINT,
  show: "Hiện mật khẩu",
  hide: "Ẩn mật khẩu",
  submit: "Xem trước xác nhận",
  completed: "Biểu mẫu đã hợp lệ",
  completedDetail:
    "Đây là trạng thái xác nhận mẫu. Mật khẩu chưa được thay đổi và dữ liệu đã được xóa khỏi biểu mẫu.",
  expired: "Liên kết đã hết hạn",
  expiredDetail: "Yêu cầu một liên kết khôi phục mới và sử dụng liên kết mới nhất trong email.",
  invalid: "Liên kết không hợp lệ",
  invalidDetail:
    "Liên kết có thể thiếu mã xác nhận hoặc đã được sử dụng. Yêu cầu gửi lại để tiếp tục.",
  request: "Yêu cầu liên kết mới",
  login: "Quay lại đăng nhập",
  demoNav: "Trạng thái giao diện mẫu",
  previewLink: "Xem trước trang đặt mật khẩu mới",
  variants: [
    { id: "form", label: "Biểu mẫu" },
    { id: "expired", label: "Hết hạn" },
    { id: "invalid", label: "Không hợp lệ" },
  ],
} as const;

/** Schema khôi phục dùng quy tắc mật khẩu mới, độc lập validation đăng nhập. */
export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, APP_MESSAGES.VALIDATION.REQUIRED("Xác nhận mật khẩu")),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: RESET_PASSWORD_CONTENT.mismatch,
    path: ["confirmPassword"],
  });

/** Dữ liệu form chỉ được giữ trong RAM; không chứa DTO token khôi phục. */
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
