/**
 * @description Danh mục đường dẫn (Routes) toàn bộ ứng dụng LegacyVault.
 * Tuân thủ quy tắc Zero Hardcoding - Tránh gõ trực tiếp string URL ("/login", "/dashboard") trong component.
 */
export const ROUTES = {
  /** Trang chủ công khai */
  HOME: "/",

  /** Nhóm đường dẫn xác thực tài khoản */
  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
  },

  /** Nhóm đường dẫn khu vực quản trị / nội bộ (Dashboard) */
  DASHBOARD: {
    ROOT: "/dashboard",
    ASSETS: "/dashboard/assets",
    ANALYTICS: "/dashboard/analytics",
    USERS: "/dashboard/users",
    SETTINGS: "/dashboard/settings",
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
  },

  /** Nhóm trang lỗi hệ thống */
  ERROR: {
    FORBIDDEN: "/403",
    NOT_FOUND: "/404",
  },
} as const;

export type AppRoute = typeof ROUTES;
