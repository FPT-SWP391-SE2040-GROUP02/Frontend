import { isAxiosError } from "axios";
import { ZodError } from "zod";
import { APP_MESSAGES, HTTP_STATUS } from "@/shared/constants";

/** Kết quả phân loại lỗi tải nhật ký để UI không biến lỗi quyền hay lỗi dữ liệu thành danh sách rỗng. */
export interface AuditLogErrorView {
  message: string;
  /** Thử lại chỉ có ích với lỗi mạng/máy chủ hoặc dữ liệu sai dạng; 404/403 là quyết định quyền. */
  canRetry: boolean;
}

/** Phân loại lỗi của GET /admin/audit-logs: 404/403 không quyền, 401 hết phiên, 400 bộ lọc bị từ chối. */
export function classifyAuditLogError(error: unknown): AuditLogErrorView {
  if (error instanceof ZodError) {
    return { message: "Dữ liệu nhật ký nhận về không đúng định dạng.", canRetry: true };
  }
  if (isAxiosError(error) && error.response) {
    const status = error.response.status;
    // BE trả 404 cho người không phải Admin đang hoạt động (SEC-04); 403 xử lý như nhau.
    if (status === HTTP_STATUS.NOT_FOUND || status === HTTP_STATUS.FORBIDDEN) {
      return { message: "Bạn không có quyền truy cập nhật ký kiểm toán.", canRetry: false };
    }
    if (status === HTTP_STATUS.UNAUTHORIZED) {
      return { message: APP_MESSAGES.ERROR.UNAUTHORIZED, canRetry: false };
    }
    if (status === HTTP_STATUS.BAD_REQUEST) {
      return { message: "Bộ lọc nhật ký không hợp lệ. Hãy đặt lại bộ lọc.", canRetry: false };
    }
  }
  return { message: APP_MESSAGES.ERROR.LOAD_FAILED, canRetry: true };
}
