import { APP_MESSAGES } from "@/shared/constants";
import type {
  AdminDashboard,
  AdminUserRole,
  AdminUserStatus,
  PaymentTransactionStatus,
} from "./admin.schema";
import type { AdminErrorKind } from "./adminError";

export const ROLE_LABELS: Record<AdminUserRole, string> = {
  USER: "Người dùng",
  VERIFIER: "Người xét duyệt",
  ADMIN: "Quản trị viên",
  EXECUTOR: "Người thực thi",
};

export const STATUS_LABELS: Record<AdminUserStatus, string> = {
  ACTIVE: "Hoạt động",
  LOCKED: "Tạm khóa",
  DISABLED: "Vô hiệu hóa",
};

export interface DashboardCounter {
  key: {
    [K in keyof AdminDashboard]: AdminDashboard[K] extends number ? K : never;
  }[keyof AdminDashboard];
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
    id: "staff",
    title: "Nhân sự và hồ sơ",
    counters: [
      { key: "activeVerifiers", label: "Người xét duyệt hoạt động", attention: false },
      { key: "activeAdmins", label: "Quản trị viên hoạt động", attention: false },
      { key: "casesWithoutVerifier", label: "Việc chưa có luật sư", attention: true },
    ],
  },
];

/** Giai đoạn của kế hoạch (PlanStatus dạng API) hiện ở khối "Kế hoạch theo giai đoạn". */
export const PLAN_STAGE_LABELS: Record<string, string> = {
  DRAFT: "Đang thiết lập",
  ACTIVE: "Đang chạy",
  HANDOVER_REQUESTED: "Đang lập phương án chia",
  HANDOVER_IN_PROGRESS: "Đang bàn giao",
};

export const planStageLabel = (stage: string) => PLAN_STAGE_LABELS[stage] ?? stage;

/** Loại việc của luật sư hiện ở chi tiết người dùng. */
export const CASE_KIND_LABELS: Record<string, string> = {
  HANDOVER_RECORD: "Biên bản",
  HANDOVER_REPORT: "Hồ sơ báo tin",
};

/** Trạng thái việc đang giữ: bước của biên bản (DRAFTING...) hoặc của hồ sơ báo tin (SUBMITTED...). */
export const CASE_STATUS_LABELS: Record<string, string> = {
  DRAFTING: "Đang lập",
  IDENTITY_CHECK: "Kiểm danh tính",
  SIGNING: "Đang ký",
  SUBMITTED: "Chờ xét",
  SUPPLEMENT_REQUESTED: "Chờ bổ sung",
};

/** Kết quả luật sư đã quyết định. */
export const DECISION_LABELS: Record<string, string> = {
  ACCEPTED: "Chấp nhận",
  REJECTED: "Từ chối",
  SUPPLEMENT_REQUESTED: "Yêu cầu bổ sung",
};

/** Trạng thái kế hoạch (PlanStatus dạng API) của kho Người thực thi đang giữ. */
export const PLAN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Đang thiết lập",
  ACTIVE: "Đang hoạt động",
  HANDOVER_REQUESTED: "Có yêu cầu nhận",
  HANDOVER_IN_PROGRESS: "Đang bàn giao",
  CLOSED: "Đã hoàn tất",
};

export const AUDIT_OUTCOME_LABELS: Record<string, string> = {
  SUCCEEDED: "Thành công",
  DENIED: "Bị từ chối",
  FAILED: "Thất bại",
};

export const ERROR_MESSAGES: Record<AdminErrorKind, string> = {
  forbidden: "Bạn không có quyền truy cập khu vực quản trị.",
  badRequest: "Bộ lọc không hợp lệ.",
  unauthorized: APP_MESSAGES.ERROR.UNAUTHORIZED,
  invalidData: "Dữ liệu từ máy chủ không hợp lệ.",
  other: APP_MESSAGES.ERROR.LOAD_FAILED,
};

export { formatDate, formatDateTime } from "@/shared/lib/dateFormat";

/** Đã khớp đơn và đã xử lý đều là giao dịch thành công, nên hiện chung một nhãn. */
export const PAYMENT_STATUS_LABELS: Record<PaymentTransactionStatus, string> = {
  RECEIVED: "Đã nhận, chờ xử lý",
  MATCHED: "Thành công",
  RECONCILIATION_REQUIRED: "Cần đối chiếu",
  RESOLVED: "Thành công",
};

/** Nhãn của giá trị lọc trạng thái giao dịch. */
export const PAYMENT_FILTER_LABELS = {
  SUCCESS: "Thành công",
  RECEIVED: "Đã nhận, chờ xử lý",
  RECONCILIATION_REQUIRED: "Cần đối chiếu",
} as const;

/** Lý do lệch theo PaymentReconciliationReasons của Backend. */
export const PAYMENT_REASON_LABELS: Record<string, string> = {
  NOT_INCOMING: "Không phải tiền vào",
  WRONG_ACCOUNT: "Chuyển sai tài khoản nhận",
  CODE_MISSING: "Không có mã thanh toán",
  ORDER_NOT_FOUND: "Mã không khớp đơn nào",
  AMOUNT_MISMATCH: "Số tiền khác tổng tiền đơn",
  ALREADY_PAID: "Đơn đã được thanh toán trước đó",
  ORDER_CANCELLED: "Đơn đã bị hủy",
  TIME_UNKNOWN: "Không đọc được giờ tiền vào",
  LATE_AFTER_EXPIRY: "Tiền vào sau khi đơn hết hạn",
};

export const paymentReasonLabel = (reason: string) => PAYMENT_REASON_LABELS[reason] ?? reason;

const moneyFormatter = new Intl.NumberFormat("vi-VN");

/** Số tiền nguyên kèm đơn vị Backend trả, ví dụ "199.000 VND". */
export const formatMoney = (amount: number, currency: string) =>
  `${moneyFormatter.format(amount)} ${currency}`;

/** Trạng thái kế hoạch mà Backend cho đổi Người thực thi và nhận việc ngay. */
const HANDOVER_PLAN_STATUSES = ["HANDOVER_REQUESTED", "HANDOVER_IN_PROGRESS"];

/** Kho đang bàn giao: đổi Người thực thi có hiệu lực ngay, không qua lời mời. */
export const isExecutorSwapImmediate = (planStatus: string) =>
  HANDOVER_PLAN_STATUSES.includes(planStatus);

/** Cảnh báo khi kho đang bàn giao: người mới nhận việc ngay. */
export const EXECUTOR_HANDOVER_WARNING =
  "Người mới nhận việc ngay, người cũ mất quyền với tài sản này. Chữ ký người cũ đã ký vẫn giữ hiệu lực.";

/** Ghi chú khi kho chưa bàn giao: người mới phải chấp nhận lời mời. */
export const EXECUTOR_INVITE_NOTE =
  "Người mới nhận lời mời và phải chấp nhận; người cũ giữ vai trò tới khi người mới chấp nhận.";

/** Thông báo sau khi giao thành công theo trạng thái Backend trả. */
export const executorAssignedMessage = (status: "INVITED" | "ACCEPTED") =>
  status === "ACCEPTED"
    ? "Người mới nhận việc ngay."
    : "Đã gửi lời mời cho Người thực thi mới. Người này cần chấp nhận để nhận việc.";
