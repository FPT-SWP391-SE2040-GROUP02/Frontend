import { ROLES, type Role } from "@/shared/constants/roles";

/** Account role labels for logout confirmation; never infer vault ownership from another role. */
export const LOGOUT_ROLE_LABELS: Record<Role, string> = {
  [ROLES.ADMIN]: "Quản trị viên",
  [ROLES.OWNER]: "Chủ kho di sản",
  [ROLES.VERIFIER]: "Người xác minh",
  [ROLES.EXECUTOR]: "Người giám hộ di sản",
  [ROLES.BENEFICIARY]: "Người thụ hưởng",
  [ROLES.NOTARY]: "Công chứng viên",
  [ROLES.STAFF]: "Nhân viên",
  [ROLES.CUSTOMER]: "Khách hàng",
  [ROLES.GUEST]: "Khách",
};

/** Honest fallback and DMS guidance while no confirmed heartbeat schedule is available. */
export const LOGOUT_CONTENT = {
  accountUnavailable: "Chưa có thông tin tài khoản để hiển thị.",
  unnamedAccount: "Tài khoản của bạn",
  dmsReminder: "Đăng xuất không thay thế điểm danh.",
  dmsGuidance:
    "Nếu bạn đang sử dụng DMS, hãy kiểm tra kỳ điểm danh trong trang Điểm danh sinh tồn.",
} as const;
