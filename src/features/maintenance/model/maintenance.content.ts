import { ROUTES } from "@/shared/config/routes.config";

/** Tham số trên /login mở lối đăng nhập dành riêng cho Quản trị viên khi đang bảo trì. */
export const MAINTENANCE_ADMIN_LOGIN_PARAM = "admin";

/** Đường dẫn đăng nhập quản trị trong lúc bảo trì. */
export const MAINTENANCE_ADMIN_LOGIN_HREF = `${ROUTES.AUTH.LOGIN}?${MAINTENANCE_ADMIN_LOGIN_PARAM}=1`;

/** Trang Admin nơi bật hoặc tắt chế độ bảo trì. */
export const MAINTENANCE_SETTINGS_HREF = `${ROUTES.ADMIN.ROOT}?view=settings`;

/** Nội dung màn hình bảo trì và các dải thông báo. */
export const MAINTENANCE_CONTENT = {
  brand: "LegacyVault",
  statusPill: "Đang bảo trì",
  title: "Chúng tôi đang nâng cấp hệ thống",
  description:
    "Dữ liệu của bạn không bị ảnh hưởng. Trang này sẽ tự mở lại ngay khi hệ thống sẵn sàng.",
  progressLabel: "Đang bảo trì hệ thống",
  gearLabel: "Bấm để quay bánh răng",
  lastChecked: "lần gần nhất",
  autoRecheck: (seconds: number) => `Tự kiểm tra mỗi ${seconds} giây`,
  recheck: "Kiểm tra lại",
  checking: "Đang kiểm tra…",
  adminPrompt: "Bạn là quản trị viên?",
  adminLogin: "Đăng nhập quản trị",
  note: "Dịch vụ lưu giữ và bàn giao dữ liệu số. Không thay thế di chúc.",
  adminBanner: "Chế độ bảo trì đang bật: chỉ tài khoản Quản trị viên truy cập được hệ thống.",
  adminBannerAction: "Mở Cấu hình hệ thống",
  loginNotice: "Hệ thống đang bảo trì. Chỉ tài khoản Quản trị viên đăng nhập được lúc này.",
  loginNoticeAction: "Về trang bảo trì",
} as const;
