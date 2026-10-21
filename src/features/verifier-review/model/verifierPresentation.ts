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

/** Nhóm hồ sơ ở hàng chờ theo thiết kế "Hàng chờ": suy từ status và mốc phản đối BE trả về. */
export type QueueCategory = "REVIEW" | "WAIT_OBJECTION" | "OBJECTED" | "SUPPLEMENT";

export const queueCategoryLabels: Record<QueueCategory, { label: string; tone: VerifierTone }> = {
  REVIEW: { label: "Chờ xét duyệt", tone: "neutral" },
  WAIT_OBJECTION: { label: "Chờ phản đối 72 giờ", tone: "warning" },
  OBJECTED: { label: "Chủ kho phản đối", tone: "danger" },
  SUPPLEMENT: { label: "Chờ bổ sung", tone: "neutral" },
};

interface QueueCategorySource {
  status: Status;
  objectionEndsAt: string | null;
}

/**
 * Chưa có mốc phản đối (Owner chưa được báo) hoặc mốc còn ở tương lai = đang chờ Chủ kho phản đối;
 * SUSPENDED = Chủ kho đã báo còn sống, cần kết luận.
 */
export function queueCategory(item: QueueCategorySource, now: number): QueueCategory {
  if (item.status === "SUSPENDED") return "OBJECTED";
  if (item.status === "SUPPLEMENT_REQUIRED") return "SUPPLEMENT";
  if (item.objectionEndsAt === null || new Date(item.objectionEndsAt).getTime() > now) {
    return "WAIT_OBJECTION";
  }
  return "REVIEW";
}

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/** Cột "Thời gian" của hàng chờ: thời gian đã chờ, giờ còn lại của 72 giờ phản đối, hoặc việc cần làm. */
export function queueTimeText(
  item: QueueCategorySource & { assignedAt: string },
  category: QueueCategory,
  now: number,
): string {
  if (category === "OBJECTED") return "Cần kết luận";
  if (category === "SUPPLEMENT") return "Đang chờ Executor bổ sung";
  if (category === "WAIT_OBJECTION") {
    if (item.objectionEndsAt === null) return "Chưa gửi thông báo";
    return `Còn ${Math.max(1, Math.ceil((new Date(item.objectionEndsAt).getTime() - now) / HOUR_MS))} giờ`;
  }
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
  OWNER_NOT_NOTIFIED: "chưa báo cho chủ kho",
  OBJECTION_PERIOD_NOT_OVER: "chưa hết 72 giờ chủ kho được phản đối",
  FLAGS_NOT_REVIEWED: "còn cảnh báo chưa kiểm tra",
  VERIFIER_CONFLICT: "bạn có quan hệ với kho này",
};

const conditionTitles: Record<Blocker, string> = {
  NOT_UNDER_REVIEW: "Hồ sơ đang ở bước xét duyệt",
  NEWER_VERSION_PENDING: "Không có bản mới chờ xét",
  OWNER_NOT_NOTIFIED: "Đã báo chủ kho",
  OBJECTION_PERIOD_NOT_OVER: "Đã hết 72 giờ phản đối",
  FLAGS_NOT_REVIEWED: "Mọi cảnh báo đã được kiểm tra",
  VERIFIER_CONFLICT: "Không có quan hệ với kho này",
};

/** Giờ và phút còn lại tới mốc, dạng "23 giờ 40 phút"; mốc đã qua thì null. */
function remainingText(endsAt: string, now: number): string | null {
  const minutes = Math.ceil((new Date(endsAt).getTime() - now) / 60_000);
  if (minutes <= 0) return null;
  return `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
}

/** Mỗi lý do chặn duyệt thành một dòng điều kiện (tên điều kiện, giải thích, nhãn chip) cho thẻ "Điều kiện để duyệt". */
export function conditionRows(
  blockers: Blocker[],
  objectionEndsAt: string | null,
  unreviewedFlags: number,
  now: number,
): ConditionRow[] {
  return blockers.map((key) => {
    let detail = blockerLabels[key];
    let chip = "Chặn duyệt";
    if (key === "OBJECTION_PERIOD_NOT_OVER" && objectionEndsAt) {
      const left = remainingText(objectionEndsAt, now);
      if (left) detail = `Còn ${left}. Chưa thể duyệt.`;
    }
    if (key === "FLAGS_NOT_REVIEWED") {
      detail = `Còn ${unreviewedFlags} cảnh báo chưa kiểm tra.`;
      chip = "Thiếu";
    }
    return { key, title: conditionTitles[key], detail, reason: conditionReasons[key], chip };
  });
}
