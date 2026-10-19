import { APP_MESSAGES } from "@/shared/constants";
import type { AdminDashboard, AdminUserRole, AdminUserStatus } from "./admin.schema";
import type { AdminErrorKind } from "./adminError";

export const ROLE_LABELS: Record<AdminUserRole, string> = {
  USER: "Người dùng",
  VERIFIER: "Người xét duyệt",
  ADMIN: "Quản trị viên",
};

export const STATUS_LABELS: Record<AdminUserStatus, string> = {
  ACTIVE: "Hoạt động",
  LOCKED: "Tạm khóa",
  DISABLED: "Vô hiệu hóa",
};

export interface DashboardCounter {
  key: Exclude<keyof AdminDashboard, "serverTime">;
  label: string;
  /** Số > 0 cần Admin chú ý. */
  attention: boolean;
}

export interface DashboardGroup {
  id: string;
  title: string;
  counters: DashboardCounter[];
}

/** Nhóm bộ đếm theo AdminDashboardResponse; không có số liệu ngoài DTO. */
export const DASHBOARD_GROUPS: DashboardGroup[] = [
  {
    id: "incidents",
    title: "Sự cố",
    counters: [
      { key: "openIncidents", label: "Đang mở", attention: false },
      { key: "overdueIncidents", label: "Quá hạn xử lý", attention: true },
      { key: "unassignedIncidents", label: "Chưa có người phụ trách", attention: true },
    ],
  },
  {
    id: "holds",
    title: "Tạm giữ",
    counters: [
      { key: "activeHolds", label: "Đang hiệu lực", attention: false },
      { key: "holdsPastReview", label: "Quá hạn rà soát", attention: true },
    ],
  },
  {
    id: "staff",
    title: "Nhân sự và hồ sơ",
    counters: [
      { key: "activeVerifiers", label: "Người xét duyệt hoạt động", attention: false },
      { key: "activeAdmins", label: "Quản trị viên hoạt động", attention: false },
      { key: "casesWithoutVerifier", label: "Hồ sơ chưa có người xét duyệt", attention: true },
    ],
  },
];

export const ERROR_MESSAGES: Record<AdminErrorKind, string> = {
  forbidden: "Bạn không có quyền truy cập khu vực quản trị.",
  badRequest: "Bộ lọc không hợp lệ.",
  unauthorized: APP_MESSAGES.ERROR.UNAUTHORIZED,
  invalidData: "Dữ liệu từ máy chủ không hợp lệ.",
  other: APP_MESSAGES.ERROR.LOAD_FAILED,
};

const dateTimeFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});
const dateFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" });

export const formatDateTime = (value: string) => dateTimeFormat.format(new Date(value));
export const formatDate = (value: string) => dateFormat.format(new Date(value));
