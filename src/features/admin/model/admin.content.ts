import { APP_MESSAGES } from "@/shared/constants";
import type {
  AdminDashboard,
  AdminUserRole,
  AdminUserStatus,
  HoldStatus,
  HoldType,
  IncidentStatus,
  IncidentType,
  INCIDENT_EVENT_KINDS,
} from "./admin.schema";
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

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  NO_VERIFIER: "Chưa có người xét duyệt",
  NO_EXECUTOR: "Chưa có người thi hành",
  CHECK_IN_OVERDUE: "Quá hạn điểm danh",
  NOTIFICATION_FAILED: "Gửi thông báo thất bại",
  OWNER_ALIVE: "Chủ kho báo còn sống",
  INTEGRATION: "Lỗi tích hợp",
  MANUAL: "Tạo thủ công",
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  OPEN: "Đang mở",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã xử lý",
};

export const INCIDENT_EVENT_LABELS: Record<(typeof INCIDENT_EVENT_KINDS)[number], string> = {
  RAISED: "Phát sinh",
  ASSIGNED: "Giao người phụ trách",
  NOTE: "Ghi chú",
  REVIEWED: "Xem lại",
  REMINDED: "Nhắc người phụ trách",
  ESCALATED: "Báo lên quản trị viên",
  RESOLVED: "Đã xử lý",
};

export const HOLD_TYPE_LABELS: Record<HoldType, string> = {
  OWNER_ALIVE: "Chủ kho báo còn sống",
  DISPUTE: "Tranh chấp",
  ADMIN: "Quản trị viên đặt",
};

export const HOLD_STATUS_LABELS: Record<HoldStatus, string> = {
  ACTIVE: "Đang hiệu lực",
  RELEASED: "Đã gỡ",
};

export const HOLD_SCOPE_LABELS: Record<string, string> = {
  VAULT: "Cả kho",
  CONTAINER: "Một gói",
  DESIGNATION: "Một chỉ định",
  CLAIM: "Một lượt nhận",
  GRANT: "Một quyền tải",
};

export const holdScopeLabel = (scope: string) => HOLD_SCOPE_LABELS[scope] ?? scope;

/** Hạn xem lại tối đa 7 ngày (BR-70, BR-72); Backend vẫn là nơi quyết định. */
export const MAX_REVIEW_DAYS = 7;

/** Giá trị `datetime-local` (giờ máy) → ISO có offset để gửi Backend. */
export function localDateTimeToIso(value: string): string {
  return new Date(value).toISOString();
}

/** Mặc định cho ô hạn xem lại: 3 ngày tới, định dạng `datetime-local`. */
export function defaultReviewLocal(now = new Date()): string {
  const target = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const offset = target.getTimezoneOffset() * 60_000;
  return new Date(target.getTime() - offset).toISOString().slice(0, 16);
}

/** Kiểm hạn xem lại nằm trong (bây giờ, bây giờ + 7 ngày]; trả thông báo lỗi hoặc chuỗi rỗng. */
export function reviewDateError(value: string, now = new Date()): string {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "Chọn ngày giờ hợp lệ.";
  if (time <= now.getTime()) return "Hạn xem lại phải ở tương lai.";
  if (time > now.getTime() + MAX_REVIEW_DAYS * 24 * 60 * 60 * 1000)
    return "Hạn xem lại tối đa 7 ngày kể từ bây giờ.";
  return "";
}
