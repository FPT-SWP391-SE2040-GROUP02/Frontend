/**
 * @description Danh mục đường dẫn (Routes) toàn bộ ứng dụng.
 * Tuân thủ quy tắc Zero Hardcoding - Tránh gõ trực tiếp string URL ("/", "/login") trong component.
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
    ANALYTICS: "/dashboard/analytics",
    USERS: "/dashboard/users",
    SETTINGS: "/dashboard/settings",
  },

  /** Nhóm trang lỗi hệ thống */
  ERROR: {
    FORBIDDEN: "/403",
    NOT_FOUND: "/404",
  },
} as const;

export type AppRoute = typeof ROUTES;
