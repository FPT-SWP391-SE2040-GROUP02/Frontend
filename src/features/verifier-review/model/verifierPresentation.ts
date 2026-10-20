import type { z } from "zod";
import type { verifierCaseStatusSchema } from "./verifierReview.schema";

type Status = z.infer<typeof verifierCaseStatusSchema>;
export type VerifierTone = "success" | "warning" | "neutral" | "danger";

/** Hồ sơ còn việc cho Verifier (hàng chờ) so với hồ sơ đã có kết quả (lịch sử). */
const OPEN_STATUSES: ReadonlyArray<Status> = ["UNDER_REVIEW", "SUPPLEMENT_REQUIRED", "SUSPENDED"];

export const isOpenCase = (status: Status) => OPEN_STATUSES.includes(status);

/** Nhãn ngắn và tông màu của trạng thái hồ sơ ở hàng chờ và tiêu đề trang chi tiết. */
export const queueStatus: Record<Status, { label: string; tone: VerifierTone }> = {
  UNDER_REVIEW: { label: "Cần xem", tone: "warning" },
  SUPPLEMENT_REQUIRED: { label: "Chờ bổ sung", tone: "neutral" },
  SUSPENDED: { label: "Tạm dừng", tone: "neutral" },
  APPROVED_FOR_HANDOVER: { label: "Đã duyệt", tone: "success" },
  REJECTED: { label: "Từ chối", tone: "danger" },
};

/** Quyết định cuối ở lịch sử: hồ sơ đã mở bàn giao là chấp thuận, bị đóng vì từ chối là từ chối. */
export const historyDecision: Partial<Record<Status, { label: string; tone: VerifierTone }>> = {
  APPROVED_FOR_HANDOVER: { label: "Chấp thuận", tone: "success" },
  REJECTED: { label: "Từ chối", tone: "neutral" },
};
