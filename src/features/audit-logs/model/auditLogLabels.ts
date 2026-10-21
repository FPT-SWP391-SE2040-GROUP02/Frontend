import type {
  auditActionValues,
  auditActorRoleValues,
  auditOutcomeValues,
  auditTargetTypeValues,
} from "./auditLog.schema";

/** Nhãn tiếng Việt cho wire action; giữ mapping tập trung ở UI. */
export const ACTION_LABELS: Record<(typeof auditActionValues)[number], string> = {
  VAULT_CREATED: "Tạo kho",
  VAULT_UPDATED: "Sửa thông tin kho",
  ASSET_CREATED: "Tải tài sản lên",
  ASSET_UPDATED: "Sửa tài sản",
  ASSET_VERSION_CREATED: "Tạo phiên bản tài sản",
  ASSET_DELETED: "Xóa tài sản",
  ASSET_CONTENT_DOWNLOADED: "Tải nội dung tài sản",
  CONTAINER_CREATED: "Tạo gói bàn giao",
  CONTAINER_UPDATED: "Sửa gói bàn giao",
  CONTAINER_ARCHIVED: "Xóa (lưu trữ) gói bàn giao",
  CONTAINER_ASSET_ADDED: "Thêm mục vào gói bàn giao",
  CONTAINER_ASSET_REMOVED: "Gỡ mục khỏi gói bàn giao",
  CONTAINER_BENEFICIARY_ADDED: "Gán người nhận cho gói bàn giao",
  CONTAINER_BENEFICIARY_REMOVED: "Gỡ người nhận khỏi gói bàn giao",
  PLAN_DEACTIVATED: "Kế hoạch về nháp",
  BENEFICIARY_CREATED: "Tạo hồ sơ người nhận",
  BENEFICIARY_UPDATED: "Sửa hồ sơ người nhận",
  BENEFICIARY_DELETED: "Xóa hồ sơ người nhận",
  CHECKED_IN: "Điểm danh",
  CHECK_IN_SETTINGS_UPDATED: "Đổi lịch điểm danh",
  HOLD_PLACED: "Đặt tạm giữ",
  HOLD_RELEASED: "Gỡ tạm giữ",
  INCIDENT_ASSIGNED: "Giao xử lý sự cố",
  INCIDENT_RESOLVED: "Đóng sự cố",
  USER_ROLE_CHANGED: "Đổi vai trò tài khoản",
  USER_STATUS_CHANGED: "Đổi trạng thái tài khoản",
  VERIFIER_REASSIGNED: "Giao lại Verifier",
  OBJECTION_REPORTED: "Báo còn sống",
  OBJECTION_CONCLUDED: "Kết luận báo còn sống",
  DEATH_CASE_OPENED: "Mở hồ sơ chứng tử",
  DEATH_CASE_SUBMITTED: "Gửi hồ sơ chứng tử",
  DEATH_CASE_VERSION_CREATED: "Tạo bản bổ sung hồ sơ",
  DEATH_CASE_FLAG_REVIEWED: "Xem xét cờ cảnh báo hồ sơ",
  DEATH_CASE_SUPPLEMENT_REQUESTED: "Yêu cầu bổ sung hồ sơ",
  DEATH_CASE_REJECTED: "Từ chối hồ sơ chứng tử",
  DEATH_CASE_APPROVED: "Duyệt hồ sơ chứng tử",
  PAYMENT_ORDER_CREATED: "Tạo đơn thanh toán",
  PAYMENT_ORDER_CANCELLED: "Hủy đơn thanh toán",
  PAYMENT_PAID: "Thanh toán thành công",
};

export const ACTOR_ROLE_LABELS: Record<(typeof auditActorRoleValues)[number], string> = {
  OWNER: "Chủ kho",
  EXECUTOR: "Người thực hiện",
  BENEFICIARY: "Người nhận",
  VERIFIER: "Người xét duyệt",
  ADMIN: "Quản trị viên",
  SYSTEM: "Hệ thống",
};

export const TARGET_TYPE_LABELS: Record<(typeof auditTargetTypeValues)[number], string> = {
  VAULT: "Kho",
  PLAN: "Kế hoạch bàn giao",
  ASSET: "Tài sản",
  CONTAINER: "Gói bàn giao",
  BENEFICIARY: "Người nhận",
  CHECK_IN: "Điểm danh",
  DEATH_CASE: "Hồ sơ chứng tử",
  HOLD: "Tạm giữ",
  INCIDENT: "Sự cố",
  USER: "Tài khoản",
  PAYMENT_ORDER: "Đơn thanh toán",
};

export const OUTCOME_LABELS: Record<(typeof auditOutcomeValues)[number], string> = {
  SUCCEEDED: "Thành công",
  DENIED: "Bị từ chối",
  FAILED: "Thất bại",
};

/** Mã rút gọn "#xxxxxx" (6 ký tự cuối) để phân biệt các dòng mà không phô bày cả UUID. */
export function shortId(id: string): string {
  return `#${id.slice(-6)}`;
}

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Tên hiển thị theo id (tài sản, người nhận, gói bàn giao) do widget tra từ các danh sách đã tải. */
export type AuditNameMap = Record<string, string>;

/** Tên thật nếu tra được, không thì mã rút gọn (đối tượng đã xóa hoặc nằm ngoài trang đã tải). */
export function displayName(id: string, names: AuditNameMap): string {
  if (Object.hasOwn(names, id)) {
    return names[id];
  }
  return shortId(id);
}

/** Lý do do Backend ghi kèm UUID ("Người nhận 01a1…"); thay bằng tên thật hoặc mã rút gọn cho dễ đọc. */
export function friendlyReason(reason: string, names: AuditNameMap = {}): string {
  return reason.replace(UUID_PATTERN, (match) => displayName(match, names));
}
