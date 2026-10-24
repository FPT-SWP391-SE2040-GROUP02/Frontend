import { isAxiosError } from "axios";
import { z } from "zod";

/** Known messages only; never display raw error bodies containing personal data. */
export function passwordRecoveryFeedback(error: unknown): {
  message: string;
  invalidToken: boolean;
} {
  const problem = isAxiosError<unknown>(error)
    ? z.object({ code: z.string().optional() }).safeParse(error.response?.data)
    : null;
  if (problem?.success && problem.data.code === "INVALID_RESET_TOKEN")
    return {
      message: "Liên kết không hợp lệ, đã hết hạn hoặc đã dùng. Yêu cầu liên kết mới.",
      invalidToken: true,
    };
  if (problem?.success && problem.data.code === "EMAIL_NOT_FOUND")
    return {
      message: "Email này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại.",
      invalidToken: false,
    };
  return {
    invalidToken: false,
    message:
      isAxiosError(error) && error.response?.status === 429
        ? "Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại."
        : "Chưa hoàn tất yêu cầu. Kiểm tra kết nối và thử lại; nếu đã gửi đặt lại mật khẩu, hãy kiểm tra bằng cách đăng nhập trước khi gửi lại.",
  };
}
