import { AxiosError, isAxiosError } from "axios";
import { APP_MESSAGES, HTTP_STATUS } from "@/shared/constants";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Chấp nhận return path nội bộ; từ chối URL ngoài, control characters và đường dẫn nhập nhằng.
 * @param value Giá trị redirect lấy từ URL, chưa được tin cậy.
 * @returns Path/query/hash nội bộ hoặc dashboard mặc định.
 * @example getLoginRedirect("/dashboard/assets?tab=files");
 */
export function getLoginRedirect(value: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\s\p{Cc}]/u.test(value)) return ROUTES.DASHBOARD.ROOT;
  try {
    const target = new URL(value, window.location.origin);
    const decodedPath = decodeURIComponent(target.pathname);
    if (target.origin !== window.location.origin || decodedPath.startsWith("//") || /[\\\p{Cc}]/u.test(decodedPath)) return ROUTES.DASHBOARD.ROOT;
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
  if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) return APP_MESSAGES.ERROR.TIMEOUT;
  if (!error.response) return APP_MESSAGES.ERROR.NETWORK;
  if (error.response.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) return APP_MESSAGES.ERROR.SERVER;
  return APP_MESSAGES.ERROR.DEFAULT;
}
