/** Trạng thái PlanStatus được Backend serialize thành UPPER_SNAKE_CASE. */
export const VAULT_PLAN_STATUS = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  CHECKIN_OVERDUE: "CHECKIN_OVERDUE",
  AWAITING_CHECK: "AWAITING_CHECK",
  DEATH_CASE_OPEN: "DEATH_CASE_OPEN",
  HANDOVER_IN_PROGRESS: "HANDOVER_IN_PROGRESS",
  CLOSED: "CLOSED",
  BLOCKED: "BLOCKED",
} as const;

/** Giá trị wire của enum C# Domain.Vaults.PlanStatus. */
export type VaultPlanStatus = (typeof VAULT_PLAN_STATUS)[keyof typeof VAULT_PLAN_STATUS];

/**
 * DTO ánh xạ Application.Features.Vaults.VaultResponse.
 * Quota dùng byte; datetime giữ ISO 8601 từ server, chưa định dạng cho UI.
 * isContentEditable không thay thế kiểm tra quyền và entitlement phía Backend.
 */
export interface VaultResponse {
  /** GUID kho duy nhất của Owner. */
  id: string;
  /** Trạng thái kế hoạch do server xác nhận. */
  status: VaultPlanStatus;
  /** Hạn mức dung lượng theo response server, tính bằng byte. */
  storageQuotaBytes: number;
  /** Dung lượng đã dùng, tính bằng byte. */
  storageUsedBytes: number;
  /** Hạn mức danh tính người nhận khác nhau. */
  beneficiarySlotQuota: number;
  /** Số gói bàn giao trong kho. */
  packageCount: number;
  /** Gợi ý khả năng sửa nội dung tại thời điểm đọc. */
  isContentEditable: boolean;
  /** Thời điểm tạo theo ISO 8601 UTC. */
  createdAt: string;
  /** Thời điểm cập nhật theo ISO 8601 UTC. */
  updatedAt: string;
}
