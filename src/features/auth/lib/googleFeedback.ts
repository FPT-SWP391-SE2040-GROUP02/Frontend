import { isAxiosError } from "axios";
import { z } from "zod";
import { getLoginErrorMessage } from "./loginFeedback";
import { HTTP_STATUS } from "@/shared/constants";

const problemSchema = z.object({ code: z.string() });

/** Chỉ hiển thị mã lỗi Google đã biết; không đưa raw ProblemDetails ra giao diện. */
export function getGoogleErrorMessage(error: unknown): string {
  if (isAxiosError<unknown>(error)) {
    if (error.response && error.response.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR)
      return getLoginErrorMessage(error);
    const problem = problemSchema.safeParse(error.response?.data);
    if (error.response?.status === 429 || error.response?.status === 423)
      return "Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.";
    if (problem.success) {
      switch (problem.data.code) {
        case "INVALID_LINK_TICKET":
          return "Phiên liên kết không còn hợp lệ. Quay lại đăng nhập Google để bắt đầu lại.";
        case "INVALID_GOOGLE_TOKEN":
          return "Thông tin đăng nhập Google không hợp lệ. Vui lòng thử lại Google.";
        case "INVALID_CREDENTIALS":
          return "Mật khẩu chưa đúng. Vui lòng kiểm tra và thử lại.";
        case "ACCOUNT_NOT_ACTIVE":
          return "Tài khoản hiện không thể đăng nhập. Vui lòng liên hệ hỗ trợ.";
        case "GOOGLE_ACCOUNT_ALREADY_LINKED":
          return "Không thể liên kết Google này. Quay lại và dùng phương thức đăng nhập đã có.";
      }
    }
  }
  return getLoginErrorMessage(error);
}
