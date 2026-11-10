import type { z } from "zod";
import {
  blockerLabels,
  type approveBlockerSchema,
  type verifierCaseStatusSchema,
} from "./verifierReview.schema";

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

/** Nhóm hồ sơ ở hàng chờ: chờ xét duyệt hoặc chờ Executor bổ sung (không còn bước chờ phản đối). */
export type QueueCategory = "REVIEW" | "SUPPLEMENT";

export const queueCategoryLabels: Record<QueueCategory, { label: string; tone: VerifierTone }> = {
  REVIEW: { label: "Chờ xét duyệt", tone: "neutral" },
  SUPPLEMENT: { label: "Chờ bổ sung", tone: "neutral" },
};

interface QueueCategorySource {
  status: Status;
}

/** Chờ bổ sung khi Executor đang sửa hồ sơ; còn lại là chờ xét duyệt ngay. */
export function queueCategory(item: QueueCategorySource): QueueCategory {
  if (item.status === "SUPPLEMENT_REQUIRED") return "SUPPLEMENT";
  return "REVIEW";
}

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/** Cột "Thời gian" của hàng chờ: thời gian đã chờ, hoặc việc cần làm. */
export function queueTimeText(
  item: QueueCategorySource & { assignedAt: string },
  category: QueueCategory,
  now: number,
): string {
  if (category === "SUPPLEMENT") return "Đang chờ Executor bổ sung";
  const days = Math.floor((now - new Date(item.assignedAt).getTime()) / DAY_MS);
  if (days < 1) return "Chờ dưới 1 ngày";
  return `Chờ ${days} ngày`;
}

type Blocker = z.infer<typeof approveBlockerSchema>;

export interface ConditionRow {
  key: Blocker;
  title: string;
  detail: string;
  /** Cụm ngắn đặt sau "Chưa thể duyệt vì:" ở thẻ Quyết định. */
  reason: string;
  chip: string;
}

const conditionReasons: Record<Blocker, string> = {
  NOT_UNDER_REVIEW: "hồ sơ không còn ở bước xét duyệt",
  NEWER_VERSION_PENDING: "đang có bản mới chờ xét",
  FLAGS_NOT_REVIEWED: "còn cảnh báo chưa kiểm tra",
  VERIFIER_CONFLICT: "bạn có quan hệ với kho này",
};

const conditionTitles: Record<Blocker, string> = {
  NOT_UNDER_REVIEW: "Hồ sơ đang ở bước xét duyệt",
  NEWER_VERSION_PENDING: "Không có bản mới chờ xét",
  FLAGS_NOT_REVIEWED: "Mọi cảnh báo đã được kiểm tra",
  VERIFIER_CONFLICT: "Không có quan hệ với kho này",
};

/** Mỗi lý do chặn duyệt thành một dòng điều kiện (tên điều kiện, giải thích, nhãn chip) cho thẻ "Điều kiện để duyệt". */
export function conditionRows(blockers: Blocker[], unreviewedFlags: number): ConditionRow[] {
  return blockers.map((key) => {
    let detail = blockerLabels[key];
    let chip = "Chặn duyệt";
    if (key === "FLAGS_NOT_REVIEWED") {
      detail = `Còn ${unreviewedFlags} cảnh báo chưa kiểm tra.`;
      chip = "Thiếu";
    }
    return { key, title: conditionTitles[key], detail, reason: conditionReasons[key], chip };
  });
}
