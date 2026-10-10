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
    FEATURE_UNAVAILABLE: "Tính năng đang được hoàn thiện. Vui lòng thử lại sau.",
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
    PASSWORD_UPPERCASE: "Mật khẩu phải có ít nhất một chữ hoa.",
    PASSWORD_SPECIAL_CHARACTER: "Mật khẩu phải có ít nhất một ký tự đặc biệt.",
  },
  UI: {
    LOADING: "Đang tải dữ liệu...",
    EMPTY: "Chưa có dữ liệu.",
    RETRY: "Thử lại",
    PREVIEW: "Bản xem trước: dữ liệu mẫu, chưa thực hiện thao tác trên tài khoản.",
    VALID_PREVIEW: "Dữ liệu hợp lệ. Đây là bản xem trước; chưa gửi hoặc lưu dữ liệu.",
  },
} as const;

// ==============================================================================
// SWP391 - SRS 3.11.0 DOMAIN CONSTANTS
// ==============================================================================

/**
 * @description Các loại tài sản số trong hệ thống (SRS 3.11.0 - ASSET-01, ASSET-02, ASSET-03)
 */
export const ASSET_TYPE = {
  FILE: "FILE",
  ACCOUNT: "ACCOUNT",
  CRYPTO_WALLET: "CRYPTO_WALLET",
} as const;
export type AssetType = (typeof ASSET_TYPE)[keyof typeof ASSET_TYPE];

/**
 * @description Chế độ người nhận của Kho bàn giao tự gom (SRS 3.11.0 - ASSET-08)
 * Single recipient (1 người) hoặc Co-owned (từ 2 người trở lên, cần đồng thuận 100%)
 */
export const RECIPIENT_MODE = {
  SINGLE_RECIPIENT: "SINGLE_RECIPIENT",
  CO_OWNED: "CO_OWNED",
} as const;
export type RecipientMode = (typeof RECIPIENT_MODE)[keyof typeof RECIPIENT_MODE];

/**
 * @description Trạng thái hồ sơ chứng tử (SRS 3.11.0 - DEATH-04, Luồng 3A & 3B)
 */
export const CLAIM_STATUS = {
  DRAFT: "DRAFT",
  UNDER_REVIEW: "UNDER_REVIEW",
  ADDITIONAL_DOCUMENTS_REQUIRED: "ADDITIONAL_DOCUMENTS_REQUIRED",
  APPROVED_FOR_DELIVERY: "APPROVED_FOR_DELIVERY",
  REJECTED: "REJECTED",
} as const;
export type ClaimStatus = (typeof CLAIM_STATUS)[keyof typeof CLAIM_STATUS];

/**
 * @description Trạng thái của Kho bàn giao tự gom (SRS 3.11.0 - Luồng 4A-4H)
 */
export const HANDOVER_STATUS = {
  WAITING_FOR_SCHEDULE: "WAITING_FOR_SCHEDULE",
  SCHEDULED: "SCHEDULED",
  HANDOVER_STARTED: "HANDOVER_STARTED",
  PENDING_RESPONSE: "PENDING_RESPONSE",
  FROZEN_RECONSIDERATION: "FROZEN_RECONSIDERATION",
  HANDOVER_COMMITTED: "HANDOVER_COMMITTED",
  CANCELLED_WITHOUT_DELIVERY: "CANCELLED_WITHOUT_DELIVERY",
} as const;
export type HandoverStatus = (typeof HANDOVER_STATUS)[keyof typeof HANDOVER_STATUS];

/**
 * @description Trạng thái lựa chọn chuyển quyền 1:1 (SRS 3.11.0 - REDIST-04)
 */
export const TRANSFER_STATUS = {
  ACTIVE: "ACTIVE",
  REPLACED: "REPLACED",
  CANCELLED: "CANCELLED",
  FINALIZED: "FINALIZED",
} as const;
export type TransferStatus = (typeof TRANSFER_STATUS)[keyof typeof TRANSFER_STATUS];

/**
 * @description Trạng thái điểm danh định kỳ DMS (SRS 3.11.0 - Luồng 2A & 2B)
 */
export const DMS_STATUS = {
  ACTIVE: "ACTIVE",
  CHECKIN_PENDING: "CHECKIN_PENDING",
  CHECKIN_SUSPENDED: "CHECKIN_SUSPENDED", // Tạm treo 90 ngày
  FROZEN_INACTIVITY: "FROZEN_INACTIVITY", // Đóng băng do bất hoạt sau 90 ngày
} as const;
export type DmsStatus = (typeof DMS_STATUS)[keyof typeof DMS_STATUS];

/**
 * @description Biểu phí và gói dịch vụ chuẩn SRS 3.11.0 (Luồng 1A & 4G)
 */
export const PLAN_TIERS = {
  // Gói Chủ sở hữu (Owner)
  OWNER_FREE: {
    id: "plan_owner_free",
    tier: "OWNER_FREE",
    name: "Owner Free",
    price: 0,
    cycle: "Vĩnh viễn",
    maxAssets: 3,
    storageLimitMb: 20,
    allowEstatePlan: false,
    allowPdfExport: false,
    description: "Lưu trữ cá nhân và điểm danh DMS, không thiết lập di sản",
  },
  LEGACY_XS: {
    id: "plan_legacy_xs",
    tier: "LEGACY_XS",
    name: "Legacy XS",
    price: 199000,
    cycle: "365 ngày",
    maxAssets: 20,
    storageLimitMb: 200,
    allowEstatePlan: true,
    allowPdfExport: false,
    description: "Thiết lập kế hoạch di sản, xác minh chứng tử và bàn giao toàn diện",
  },
  LEGACY_XS_MAX: {
    id: "plan_legacy_xs_max",
    tier: "LEGACY_XS_MAX",
    name: "Legacy XS Max",
    price: 399000,
    cycle: "365 ngày",
    maxAssets: 50,
    storageLimitMb: 500,
    allowEstatePlan: true,
    allowPdfExport: true,
    description: "Đầy đủ quyền năng di sản và quyền xuất PDF Kế hoạch di sản",
  },
  // Gói Kho cá nhân Người thụ hưởng (Beneficiary)
  RECIPIENT_FREE: {
    id: "plan_recipient_free",
    tier: "RECIPIENT_FREE",
    name: "Kho Người Nhận Free",
    price: 0,
    cycle: "Vĩnh viễn",
    maxAssets: 2,
    storageLimitMb: 20,
    description: "Lưu trữ nội dung đã được bàn giao trong hạn ngạch cơ bản",
  },
  RECIPIENT_PLUS: {
    id: "plan_recipient_plus",
    tier: "RECIPIENT_PLUS",
    name: "Kho Người Nhận Plus",
    price: 49000,
    cycle: "30 ngày",
    maxAssets: 10,
    storageLimitMb: 200,
    description: "Mở rộng dung lượng lưu trữ nội dung di sản đã nhận",
  },
} as const;

/**
 * @description Nội dung cam kết pháp lý bắt buộc theo quy định SRS 3.11.0 (DEATH-02)
 * Bắt buộc áp dụng cho Executor khi nộp chứng tử và Verifier khi phê duyệt hồ sơ.
 */
export const LEGAL_ATTESTATION_TEXT = "Tôi chịu trách nhiệm trước pháp luật" as const;
