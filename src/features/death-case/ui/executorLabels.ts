import type { Tone } from "@/shared/ui/heritageKit";

/** Nhãn tiếng Việt cho dữ liệu Executor/hồ sơ chứng tử trả về từ Backend. */

/** Tên trạng thái kế hoạch (PlanStatus của Backend, dạng UPPER_SNAKE_CASE) bằng tiếng Việt. */
const planStatusLabels: Record<string, string> = {
  DRAFT: "Đang thiết lập",
  ACTIVE: "Đang hoạt động",
  CHECKIN_OVERDUE: "Quá hạn điểm danh",
  AWAITING_CHECK: "Chờ Executor kiểm tra",
  DEATH_CASE_OPEN: "Đã có hồ sơ báo tin",
  HANDOVER_IN_PROGRESS: "Đang bàn giao",
  CLOSED: "Đã hoàn tất",
  BLOCKED: "Đang tạm giữ",
};

export function planStatusLabel(status: string): string {
  return planStatusLabels[status] ?? status;
}

/** Trạng thái hồ sơ chứng tử (DeathCaseStatus) bằng tiếng Việt, kèm tông màu cho nhãn. */
export const caseStatusInfo: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Bản nháp", tone: "neutral" },
  UNDER_REVIEW: { label: "Đang xét duyệt", tone: "warning" },
  SUPPLEMENT_REQUIRED: { label: "Cần bổ sung", tone: "warning" },
  APPROVED_FOR_HANDOVER: { label: "Đã duyệt", tone: "success" },
  REJECTED: { label: "Bị từ chối", tone: "danger" },
  SUSPENDED: { label: "Tạm dừng", tone: "neutral" },
};

/** Mã phần cần bổ sung / còn thiếu của hồ sơ (missingRequirements, requestedParts) bằng tiếng Việt. */
export const requirementLabels: Record<string, string> = {
  OWNER_FULL_NAME: "Họ tên Chủ kho",
  OWNER_CITIZEN_ID: "Số CCCD Chủ kho",
  DATE_OF_DEATH: "Ngày mất",
  CERTIFICATE_NUMBER: "Số giấy chứng tử",
  ISSUED_ON: "Ngày cấp",
  ISSUED_BY: "Nơi cấp",
  FILES: "Trang giấy chứng tử",
};
