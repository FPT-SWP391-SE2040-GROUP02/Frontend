import type {
  auditActionValues,
  auditActorRoleValues,
  auditOutcomeValues,
  auditTargetTypeValues,
} from "./auditLog.schema";

/** Nhãn tiếng Việt cho wire action; giữ mapping tập trung ở UI. */
export const ACTION_LABELS: Record<(typeof auditActionValues)[number], string> = {
  VAULT_CREATED: "Tạo tài sản",
  VAULT_UPDATED: "Sửa thông tin tài sản",
  ASSET_CREATED: "Tải tài sản lên",
  ASSET_UPDATED: "Sửa tài sản",
  ASSET_VERSION_CREATED: "Tạo phiên bản tài sản",
  ASSET_DELETED: "Xóa tài sản",
  ASSET_CONTENT_DOWNLOADED: "Tải nội dung tài sản",
  CONTAINER_CREATED: "Tạo gói bàn giao (tính năng cũ)",
  CONTAINER_UPDATED: "Sửa gói bàn giao (tính năng cũ)",
  CONTAINER_ARCHIVED: "Xóa gói bàn giao (tính năng cũ)",
  CONTAINER_REMOVED: "Xóa gói bàn giao (tính năng cũ)",
  CONTAINER_ASSET_ADDED: "Thêm mục vào gói bàn giao (tính năng cũ)",
  CONTAINER_ASSET_REMOVED: "Gỡ mục khỏi gói bàn giao (tính năng cũ)",
  CONTAINER_BENEFICIARY_ADDED: "Gán người nhận cho gói bàn giao (tính năng cũ)",
  CONTAINER_BENEFICIARY_REMOVED: "Gỡ người nhận khỏi gói bàn giao (tính năng cũ)",
  ASSET_ASSIGNED: "Gán tài sản cho người nhận",
  ASSET_UNASSIGNED: "Gỡ gán tài sản khỏi người nhận",
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
  VERIFIER_REASSIGNED: "Giao lại Người xét duyệt",
  DEATH_CASE_OPENED: "Mở hồ sơ chứng tử",
  DEATH_CASE_DRAFT_CANCELLED: "Hủy hồ sơ chứng tử nháp",
  DEATH_CASE_SUBMITTED: "Gửi hồ sơ chứng tử",
  DEATH_CASE_VERSION_CREATED: "Tạo bản bổ sung hồ sơ",
  DEATH_CASE_FLAG_REVIEWED: "Xem xét cờ cảnh báo hồ sơ",
  DEATH_CASE_SUPPLEMENT_REQUESTED: "Yêu cầu bổ sung hồ sơ",
  DEATH_CASE_REJECTED: "Từ chối hồ sơ chứng tử",
  DEATH_CASE_APPROVED: "Duyệt hồ sơ chứng tử",
  PAYMENT_ORDER_CREATED: "Tạo đơn thanh toán",
  PAYMENT_ORDER_CANCELLED: "Hủy đơn thanh toán",
  PAYMENT_PAID: "Thanh toán thành công",
  SERVICE_GRACE_STARTED: "Hết hạn dịch vụ, chuyển sang chỉ đọc",
  VAULT_PIN_SET: "Đặt mã PIN tài sản",
  VAULT_PIN_CHANGED: "Đổi mã PIN tài sản",
  VAULT_PIN_RESET: "Đặt lại mã PIN tài sản",
  VAULT_PIN_WRONG: "Nhập sai mã PIN tài sản",
  VAULT_PIN_LOCKED: "Mã PIN tài sản bị khóa tạm",
  TIER_OVERRIDE_BELOW_RECOMMENDED: "Chọn tầng bảo mật thấp hơn khuyến nghị",
  DEATH_CASE_SUPPLEMENT_EXHAUSTED: "Đóng hồ sơ sau 3 vòng bổ sung",
  DEV_TIME_TRAVEL: "Tua thời gian thử nghiệm",
  DEV_CLOCK_RESET: "Đưa đồng hồ về thời gian thực",
  DEV_EKYC_RESET: "Đặt lại dữ liệu eKYC",
  DEV_REWIND_BEFORE_EKYC: "Tua tài sản về trước eKYC",
  DEV_UPDATE_EKYC_THRESHOLD: "Cập nhật ngưỡng so khớp khuôn mặt",
  ADMIN_CREATED_USER: "Tạo tài khoản hệ thống",
  ADMIN_UPDATED_USER_PROFILE: "Sửa thông tin tài khoản nhân sự",
  SYSTEM_CONFIG_UPDATED: "Cập nhật cấu hình dịch vụ",
  SYSTEM_CONFIG_RESET: "Khôi phục cấu hình dịch vụ",
  EXECUTOR_KEY_ISSUED: "Cấp mã nhận cho Người thực thi",
  EXECUTOR_KEY_REISSUED: "Cấp lại mã nhận (quên khóa)",
  EXECUTOR_ASSIGNED_BY_ADMIN: "Admin giao Người thực thi",
  DEV_TOGGLE_EKYC_PAUSE: "Bật hoặc tắt tạm ngừng eKYC",
  HANDOVER_SUBMISSION_APPROVED: "Duyệt hồ sơ người nhận",
  HANDOVER_SUBMISSION_SUPPLEMENT_REQUESTED: "Yêu cầu người nhận bổ sung hồ sơ",
  HANDOVER_EXECUTOR_REMINDED: "Luật sư nhắc Người thực thi ký biên bản",
  SYSTEM_SETTING_UPDATED: "Cập nhật tham số hệ thống",
  PLAN_ACTIVATED: "Kích hoạt kế hoạch bàn giao",
  EXECUTOR_ACCEPTED: "Người thực thi nhận vai",
  WILL_RESIGNED: "Ký lại biên bản phân chia",
  WILL_SIGNED: "Chủ tài sản ký biên bản phân chia",
  EXECUTOR_WILL_CONFIRMED: "Người thực thi đồng ý biên bản mới",
  EXECUTOR_WILL_DECLINED: "Người thực thi không đồng ý biên bản mới",
  EXECUTOR_WILL_VIEWED: "Người thực thi xem biên bản phân chia",
  WILL_IDENTITY_VIEWED: "Xem CCCD đầy đủ của người nhận",
  LOGIN_SUCCEEDED: "Đăng nhập thành công",
  LOGIN_FAILED: "Đăng nhập sai mật khẩu",
  LOGIN_LOCKED: "Tài khoản bị khóa tạm do đăng nhập sai",
  TWO_FACTOR_ENABLED: "Bật xác thực hai bước",
  TWO_FACTOR_DISABLED: "Tắt xác thực hai bước",
  PASSWORD_RESET_COMPLETED: "Đặt lại mật khẩu",
  PASSWORD_CHANGED: "Đổi mật khẩu",
  EKYC_PASSED: "Xác minh eKYC đạt",
  EKYC_FAILED: "Xác minh eKYC không đạt",
};

export const ACTOR_ROLE_LABELS: Record<(typeof auditActorRoleValues)[number], string> = {
  OWNER: "Chủ tài sản",
  EXECUTOR: "Người thực thi",
  BENEFICIARY: "Người nhận",
  VERIFIER: "Người xét duyệt",
  ADMIN: "Quản trị viên",
  SYSTEM: "Hệ thống",
};

export const TARGET_TYPE_LABELS: Record<(typeof auditTargetTypeValues)[number], string> = {
  VAULT: "Tài sản",
  PLAN: "Kế hoạch bàn giao",
  ASSET: "Tài sản",
  CONTAINER: "Gói bàn giao (tính năng cũ)",
  BENEFICIARY: "Người nhận",
  CHECK_IN: "Điểm danh",
  DEATH_CASE: "Hồ sơ chứng tử",
  HOLD: "Tạm giữ",
  INCIDENT: "Sự cố",
  USER: "Tài khoản",
  PAYMENT_ORDER: "Đơn thanh toán",
  CONFIGURATION: "Cấu hình hệ thống",
  HANDOVER_TURN: "Lượt bàn giao",
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

/** Mã lý do Backend ghi khi hồ sơ chứng tử bị từ chối (lý do tự do của Verifier không vào nhật ký). */
const REASON_CODE_LABELS: Record<string, string> = {
  VERIFIER_REJECTED: "Người xét duyệt từ chối hồ sơ",
  ALIVE_CONFIRMED: "Xác nhận còn sống (luồng đã gỡ)",
};

/** Lý do do Backend ghi kèm UUID ("Người nhận 01a1…"); thay bằng tên thật hoặc mã rút gọn cho dễ đọc. */
export function friendlyReason(reason: string, names: AuditNameMap = {}): string {
  if (Object.hasOwn(REASON_CODE_LABELS, reason)) {
    return REASON_CODE_LABELS[reason];
  }
  return reason.replace(UUID_PATTERN, (match) => displayName(match, names));
}
