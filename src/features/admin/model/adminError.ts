import { isAxiosError } from "axios";
import { ZodError, z } from "zod";
import { HTTP_STATUS } from "@/shared/constants";

/** Phân loại lỗi để UI không biến 404 không quyền thành danh sách rỗng. */
export type AdminErrorKind = "forbidden" | "badRequest" | "unauthorized" | "invalidData" | "other";

export function classifyAdminError(error: unknown): AdminErrorKind {
  if (error instanceof ZodError) return "invalidData";
  if (isAxiosError(error) && error.response) {
    const status = error.response.status;
    // BE trả 404 cho người không phải Admin đang hoạt động (SEC-04); 403 xử lý như nhau.
    if (status === HTTP_STATUS.NOT_FOUND || status === HTTP_STATUS.FORBIDDEN) return "forbidden";
    if (status === HTTP_STATUS.BAD_REQUEST) return "badRequest";
    if (status === HTTP_STATUS.UNAUTHORIZED) return "unauthorized";
  }
  return "other";
}

const problem = z.object({ code: z.string().optional(), reason: z.string().optional() });

/** Lý do cụ thể của 409 ADMIN_ACTION_NOT_ALLOWED (AdminService, HoldService). */
const ACTION_REASONS: Record<string, string> = {
  CANNOT_CHANGE_SELF: "Bạn không thể đổi vai trò hoặc trạng thái của chính mình.",
  LAST_ADMIN: "Hệ thống phải còn ít nhất một quản trị viên đang hoạt động.",
  CASE_NOT_PENDING:
    "Hồ sơ này không còn ở giai đoạn chờ xét nên không giao lại người xét duyệt được.",
  HOLD_OWNER_ALIVE:
    "Tạm giữ do chủ kho báo còn sống chỉ được gỡ khi người xét duyệt kết luận. Quản trị viên không tự gỡ.",
  HOLD_RELEASED: "Tạm giữ này đã được gỡ. Tải lại để xem trạng thái mới nhất.",
};

/** Câu báo theo mã lỗi riêng của khu vực quản trị. */
const ACTION_CODES: Record<string, string> = {
  INCIDENT_NOT_FOUND: "Không tìm thấy sự cố. Tải lại danh sách trước khi tiếp tục.",
  INCIDENT_NOT_OPEN: "Sự cố đã được xử lý nên không thể thao tác thêm.",
  HOLD_NOT_FOUND: "Không tìm thấy tạm giữ. Tải lại danh sách trước khi tiếp tục.",
  USER_NOT_FOUND: "Không tìm thấy tài khoản. Tải lại danh sách trước khi tiếp tục.",
  EDIT_CONFLICT: "Dữ liệu vừa bị thay đổi ở nơi khác. Tải lại để xem bản mới nhất rồi thử lại.",
};

/**
 * Thông báo cho thao tác ghi của Admin. Đọc `code` rồi `reason`, không đọc `title`.
 * Trả chuỗi rỗng khi không có câu riêng để caller dùng thông báo chung của `privateActionError`.
 */
export function adminActionError(failure: unknown): string {
  if (isAxiosError<unknown>(failure) && failure.response) {
    const parsed = problem.safeParse(failure.response.data);
    if (!parsed.success) return "";
    const { code, reason } = parsed.data;
    if (code === "ADMIN_ACTION_NOT_ALLOWED") {
      return reason && Object.hasOwn(ACTION_REASONS, reason) ? ACTION_REASONS[reason] : "";
    }
    if (code && Object.hasOwn(ACTION_CODES, code)) return ACTION_CODES[code];
  }
  return "";
}
