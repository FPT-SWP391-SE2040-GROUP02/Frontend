import { AxiosError, isAxiosError } from "axios";
import { APP_MESSAGES, HTTP_STATUS } from "@/shared/constants";
import { ROUTES } from "@/shared/config/routes.config";
import { z } from "zod";

const authProblem = z.object({ code: z.string() });

/**
 * @description Chấp nhận return path nội bộ; từ chối URL ngoài, control characters và đường dẫn nhập nhằng.
 * @param value Giá trị redirect lấy từ URL, chưa được tin cậy.
 * @returns Path/query/hash nội bộ hoặc dashboard mặc định.
 * @example getLoginRedirect("/dashboard/assets?tab=files");
 */
export function getLoginRedirect(value: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\s\p{Cc}]/u.test(value))
    return ROUTES.DASHBOARD.ROOT;
  try {
    const target = new URL(value, window.location.origin);
    const decodedPath = decodeURIComponent(target.pathname);
    if (
      target.origin !== window.location.origin ||
      decodedPath.startsWith("//") ||
      /[\\\p{Cc}]/u.test(decodedPath)
    )
      return ROUTES.DASHBOARD.ROOT;
    if (target.pathname === ROUTES.AUTH.LOGIN) return ROUTES.DASHBOARD.ROOT;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return ROUTES.DASHBOARD.ROOT;
  }
}

/**
 * @description Hiển thị lỗi transport an toàn; không suy diễn lượt thử, lockout hoặc lộ response BE.
 * @param error Lỗi mutation chưa xác định.
 * @returns Thông báo chung phù hợp mạng/timeout/server hoặc lỗi đăng nhập chưa phân loại.
 * @example getLoginErrorMessage(new Error("untrusted details"));
 */
export function getLoginErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) return APP_MESSAGES.ERROR.DEFAULT;
  if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT)
    return APP_MESSAGES.ERROR.TIMEOUT;
  if (!error.response) return APP_MESSAGES.ERROR.NETWORK;
  if (error.response.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) return APP_MESSAGES.ERROR.SERVER;
  if (error.response.status === HTTP_STATUS.TOO_MANY_REQUESTS || error.response.status === 423)
    return "Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.";
  const parsed = authProblem.safeParse(error.response.data);
  if (parsed.success) {
    if (
      error.response.status === HTTP_STATUS.UNAUTHORIZED &&
      parsed.data.code === "INVALID_CREDENTIALS"
    )
      return "Email hoặc mật khẩu chưa đúng.";
    if (
      error.response.status === HTTP_STATUS.FORBIDDEN &&
      parsed.data.code === "ACCOUNT_NOT_ACTIVE"
    )
      return "Tài khoản hiện không thể đăng nhập. Vui lòng liên hệ hỗ trợ.";
    if (
      error.response.status === HTTP_STATUS.BAD_REQUEST &&
      parsed.data.code === "VALIDATION_ERROR"
    )
      return "Thông tin đăng nhập chưa hợp lệ. Kiểm tra email và mật khẩu.";
  }
  return APP_MESSAGES.ERROR.DEFAULT;
}
