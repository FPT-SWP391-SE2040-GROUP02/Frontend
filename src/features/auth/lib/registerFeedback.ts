import { getLoginErrorMessage } from "./loginFeedback";

/**
 * @description Hiển thị lỗi transport bằng thông báo chung; không suy diễn mã lỗi nghiệp vụ chưa có contract.
 * @param error Lỗi đăng ký từ mutation.
 * @returns Thông báo an toàn từ APP_MESSAGES, không hiển thị raw response BE.
 */
export function getRegisterErrorMessage(error: unknown): string {
  return getLoginErrorMessage(error);
}
