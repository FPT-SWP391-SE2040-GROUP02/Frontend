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
  eyebrow: "Bảo trì hệ thống",
  title: "LegacyVault đang được bảo trì",
  description:
    "Chúng tôi đang nâng cấp hệ thống để phục vụ an toàn và ổn định hơn. Trong thời gian này, bạn tạm thời chưa thể đăng nhập hoặc thao tác với kho.",
  points: [
    {
      title: "Dữ liệu của bạn vẫn an toàn",
      detail: "Nội dung trong kho luôn được mã hóa và không bị ảnh hưởng bởi việc bảo trì.",
    },
    {
      title: "Tự động mở lại",
      detail:
        "Trang này tự kiểm tra trạng thái và đưa bạn trở lại ngay khi hệ thống hoạt động, không cần tải lại trang.",
    },
  ],
  panelTitle: "Trạng thái hệ thống",
  panelStatus: "Đang bảo trì",
  lastChecked: "Kiểm tra gần nhất",
  notChecked: "Chưa có",
  autoRecheck: (seconds: number) => `Tự kiểm tra lại sau mỗi ${seconds} giây`,
  recheck: "Kiểm tra ngay",
  checking: "Đang kiểm tra…",
  adminPrompt: "Bạn là quản trị viên?",
  adminLogin: "Đăng nhập quản trị",
  note: "Dịch vụ lưu giữ và bàn giao dữ liệu số. Không thay thế di chúc.",
  adminBanner: "Chế độ bảo trì đang bật: chỉ tài khoản Quản trị viên truy cập được hệ thống.",
  adminBannerAction: "Mở Cấu hình hệ thống",
  loginNotice: "Hệ thống đang bảo trì. Chỉ tài khoản Quản trị viên đăng nhập được lúc này.",
  loginNoticeAction: "Về trang bảo trì",
} as const;
