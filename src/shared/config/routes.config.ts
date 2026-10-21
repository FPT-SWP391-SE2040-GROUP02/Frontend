/**
 * @description Danh mục đường dẫn (Routes) toàn bộ ứng dụng LegacyVault.
 * Tuân thủ quy tắc Zero Hardcoding - Tránh gõ trực tiếp string URL ("/login", "/dashboard") trong component.
 */
export const ROUTES = {
  /** Trang chủ công khai */
  HOME: "/",
  RECEIVE: "/receive",

  /** Trang thông tin công khai: hỗ trợ và pháp lý (liên kết từ chân trang landing) */
  PUBLIC: {
    FAQ: "/faq",
    CONTACT: "/contact",
    TERMS: "/terms",
    PRIVACY: "/privacy",
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
    IDENTITY: "/dashboard/identity",
    ROOT: "/dashboard",
    ASSETS: "/dashboard/assets",
    /** Chi tiết một mục trong kho: thông tin, phiên bản, thêm phiên bản, xóa. */
    ASSET_DETAIL: (id: string) => `/dashboard/assets/${id}`,
    /** Chi tiết một gói bàn giao (container): mục, người nhận, đổi tên, xóa. */
    GROUP_DETAIL: (id: string) => `/dashboard/assets/groups/${id}`,
    BENEFICIARIES: "/dashboard/beneficiaries",
    /** Người tin cậy của Chủ kho: Người thực hiện (Executor) và Người xét duyệt. */
    TRUSTED_PEOPLE: "/dashboard/trusted-people",
    AUDIT_LOG: "/dashboard/audit-log",
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
    /** Tổng quan Người xét duyệt (Verifier); cũng là trang chủ của vai trò này. */
    WORKSPACE: "/notary/workspace",
    /** Hàng chờ; ?caseId= mở chi tiết một hồ sơ. */
    QUEUE: "/notary/queue",
    CRITERIA: "/notary/criteria",
    HISTORY: "/notary/history",
    SETTINGS: "/notary/settings",
  },

  /** Cổng người giám hộ di sản / Digital Executor */
  EXECUTOR: {
    INVITATION: "/executor-invitation",
    /** Tên cũ của cổng Executor; giữ để link/email cũ vẫn dùng được, chuyển về ROOT. */
    CLAIM: "/executor/claim",
    ROOT: "/executor",
    REPORT: "/executor/report",
    PROGRESS: "/executor/progress",
    PERMISSIONS: "/executor/permissions",
    SETTINGS: "/executor/settings",
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
