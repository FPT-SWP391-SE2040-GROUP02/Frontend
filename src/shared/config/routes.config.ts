/**
 * @description Danh mục đường dẫn (Routes) toàn bộ ứng dụng LegacyVault.
 * Tuân thủ quy tắc Zero Hardcoding - Tránh gõ trực tiếp string URL ("/login", "/dashboard") trong component.
 */
export const ROUTES = {
  /** Trang chủ công khai */
  HOME: "/",
  /** Bản xem trước dữ liệu mẫu, chỉ được đăng ký khi chạy development. */
  PREVIEW: {
    OWNER: "/preview/owner",
    ASSETS: "/preview/assets",
    PLANS: "/preview/plans",
    PLAN_WIZARD: "/preview/plans/new",
    DMS: "/preview/dms",
    EXECUTOR: "/preview/executor",
    VERIFIER: "/preview/verifier",
    EKYC_CAMERA: "/preview/ekyc/camera",
    BENEFICIARY: "/preview/beneficiary",
    ADMIN: "/preview/admin",
    SETTINGS: "/preview/settings",
    CHECKOUT: "/preview/checkout",
  },

  /** Nhóm đường dẫn xác thực tài khoản */
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    LINK_GOOGLE: "/auth/link-google",
    VERIFY_EMAIL: "/auth/verify-email",
    TWO_FACTOR: "/auth/2fa",
    LOGOUT: "/logout",
    LOGGED_OUT: "/auth/logged-out",
    SESSION_EXPIRED: "/auth/session-expired",
  },

  /** Nhóm đường dẫn khu vực quản trị / nội bộ (Dashboard) */
  DASHBOARD: {
    ROOT: "/dashboard",
    ASSETS: "/dashboard/assets",
    ANALYTICS: "/dashboard/analytics",
    USERS: "/dashboard/users",
    SETTINGS: "/dashboard/settings",
  },

  /** Nhóm đường dẫn Di Chúc Số & Lập Di Chúc (Will Wizard) */
  WILLS: {
    ROOT: "/dashboard/wills",
    NEW: "/dashboard/wills/new",
    DETAIL: (id: string) => `/dashboard/wills/${id}`,
  },

  /** Nhóm đường dẫn bảng giá & thanh toán SePay */
  BILLING: {
    PLANS: "/pricing",
    CHECKOUT: "/billing/checkout",
    HISTORY: "/billing/history",
  },

  /** Cổng công chứng viên / Legal Verifier */
  NOTARY: {
    WORKSPACE: "/notary/workspace",
  },

  /** Cổng người giám hộ di sản / Digital Executor */
  EXECUTOR: {
    CLAIM: "/executor/claim",
  },

  /** Cổng người thụ hưởng / Beneficiary */
  BENEFICIARY: {
    CLAIM: "/claim/beneficiary",
    HANDOVER: "/claim/beneficiary/handover",
    EKYC_CAMERA: "/claim/beneficiary/ekyc/camera",
  },

  /** Quản trị hệ thống & Sổ cái kiểm toán WORM */
  ADMIN: {
    ROOT: "/admin",
    AUDIT_LOG: "/admin/audit-logs",
  },

  /** Dead Man's Switch (Nhịp sinh tồn & kích hoạt bàn giao di sản) */
  DMS: {
    ROOT: "/dms",
    CONFIG: "/dms/config",
    HISTORY: "/dms/history",
  },

  /** Nhóm trang lỗi hệ thống */
  ERROR: {
    FORBIDDEN: "/403",
    NOT_FOUND: "/404",
    SERVER: "/500",
  },
} as const;

export type AppRoute = typeof ROUTES;
