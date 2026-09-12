// ==============================================================================
// SWP391 - Shared Constants (HTTP Status, Messages, Entity Status)
// Tránh Hardcode - Sử dụng đồng nhất cho toàn bộ Frontend
// ==============================================================================

/**
 * @description Tập hợp các mã trạng thái HTTP tiêu chuẩn (HTTP Status Codes)
 * Giúp tuân thủ Zero Hardcoding Rule, không gõ số magic numbers (như 200, 401, 403, 500) trong mã nguồn.
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/** Kiểu dữ liệu tương ứng của các mã trạng thái HTTP */
export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

/**
 * @description Trạng thái nghiệp vụ chung cho các Entity (Users, Orders, Products, Requests)
 * Tuân thủ quy tắc Zero Hardcoding - Không gõ chuỗi thô trong code.
 */
export const STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
  DRAFT: "DRAFT",
} as const;

/** Kiểu dữ liệu của trạng thái nghiệp vụ */
export type Status = (typeof STATUS)[keyof typeof STATUS];

/**
 * @description Tập hợp thông điệp hệ thống dùng chung cho Thông báo (Toast), Alert, Error Boundary và Form Validation.
 * Đảm bảo tính nhất quán của văn bản và tránh hardcode magic strings trong UI components.
 */
export const APP_MESSAGES = {
  /** Thông điệp khi thao tác thành công */
  SUCCESS: {
    CREATE: "Tạo mới thành công!",
    UPDATE: "Cập nhật dữ liệu thành công!",
    DELETE: "Xóa dữ liệu thành công!",
    SAVE: "Lưu thông tin thành công!",
    OPERATION: "Thao tác thành công!",
  },
  /** Thông điệp khi xảy ra lỗi hệ thống hoặc mạng */
  ERROR: {
    DEFAULT: "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại!",
    NETWORK: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.",
    UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!",
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
    NOT_FOUND: "Không tìm thấy dữ liệu yêu cầu.",
    SERVER: "Máy chủ đang gặp sự cố. Vui lòng liên hệ quản trị viên.",
    TIMEOUT: "Yêu cầu đã quá thời gian phản hồi (Timeout).",
    LOAD_FAILED: "Không thể tải dữ liệu.",
  },
  /** Thông điệp phục vụ cho việc kiểm tra tính hợp lệ của dữ liệu (Validation) */
  VALIDATION: {
    REQUIRED: (field: string) => `${field} không được để trống`,
    INVALID_EMAIL: "Email không đúng định dạng",
    INVALID_PHONE: "Số điện thoại không hợp lệ",
    MIN_LENGTH: (field: string, min: number) => `${field} phải có ít nhất ${min} ký tự`,
    MAX_LENGTH: (field: string, max: number) => `${field} không được vượt quá ${max} ký tự`,
    NUMBER: (field: string) => `${field} phải là chữ số hợp lệ`,
    PASSWORD_NOT_MATCH: "Mật khẩu xác nhận không trùng khớp",
  },
} as const;
