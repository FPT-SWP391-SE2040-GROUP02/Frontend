import { isAxiosError } from "axios";
import { z } from "zod";
import { getLoginErrorMessage } from "./loginFeedback";

const registerProblem = z.object({ code: z.string().optional() });

/**
 * @description Hiển thị lỗi đăng ký tài khoản, phát hiện chính xác mã lỗi EMAIL_ALREADY_EXISTS từ Backend.
 * @param error Lỗi đăng ký từ mutation.
 * @returns Thông báo tiếng Việt rõ ràng cho người dùng.
 */
export function getRegisterErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response) {
    const parsed = registerProblem.safeParse(error.response.data);
    if (parsed.success && parsed.data.code === "EMAIL_ALREADY_EXISTS") {
      return "Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng tính năng Quên mật khẩu.";
    }
  }
  return getLoginErrorMessage(error);
}
