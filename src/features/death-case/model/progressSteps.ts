import type { DeathCase } from "./deathCase.schema";
import type { HandoverProgress } from "./handoverProgress.schema";

export type StepState = "done" | "current" | "pending" | "error";

export interface ProgressStep {
  label: string;
  state: StepState;
  caption: string;
}

/** 6 bước theo thiết kế "Tiến trình bàn giao". */
const STEP_LABELS = [
  "Báo tin",
  "Phản đối 72 giờ",
  "Xét duyệt",
  "Xác minh eKYC",
  "Đồng ý hoặc từ chối",
  "Tải nội dung 30 ngày",
] as const;

const CAPTIONS: Record<StepState, string> = {
  done: "Xong",
  current: "Đang ở đây",
  pending: "Chờ",
  error: "Bị từ chối",
};

/**
 * Chỉ số bước đang diễn ra (0–5), 6 = tất cả xong, -1 = không có bước đang chạy (chưa bắt đầu hoặc bị từ chối).
 * Chỉ dựa vào trạng thái Backend trả về; không tự suy ra thông tin Backend không cung cấp.
 */
export function currentStepIndex(
  record: DeathCase | null | undefined,
  progress: HandoverProgress | null | undefined,
  now: Date,
): number {
  if (!record) return -1;
  switch (record.status) {
    case "DRAFT":
      return 0;
    case "UNDER_REVIEW": {
      const objectionOpen = record.objectionEndsAt ? new Date(record.objectionEndsAt) > now : false;
      return objectionOpen ? 1 : 2;
    }
    case "SUPPLEMENT_REQUIRED":
    case "SUSPENDED":
      return 2;
    case "REJECTED":
      return -1;
    case "APPROVED_FOR_HANDOVER": {
      const turns = progress?.turns ?? [];
      const committed = turns.filter((turn) => turn.status === "HANDOVER_COMMITTED");
      if (committed.length > 0) {
        const allDone = committed.every(
          (turn) => turn.totalItems > 0 && turn.downloadedItems >= turn.totalItems,
        );
        const othersEnded = turns.every(
          (turn) =>
            turn.status === "HANDOVER_COMMITTED" ||
            turn.status === "DECLINED" ||
            turn.status === "DECISION_EXPIRED" ||
            turn.status === "CANCELLED" ||
            turn.status === "LAPSED",
        );
        return allDone && othersEnded ? 6 : 5;
      }
      return turns.some((turn) => turn.status === "READY_TO_ACCEPT") ? 4 : 3;
    }
  }
}

export function deriveSteps(
  record: DeathCase | null | undefined,
  progress: HandoverProgress | null | undefined,
  now: Date,
): ProgressStep[] {
  const current = currentStepIndex(record, progress, now);
  const rejected = record?.status === "REJECTED";
  return STEP_LABELS.map((label, index) => {
    let state: StepState;
    if (rejected) {
      state = index < 2 ? "done" : index === 2 ? "error" : "pending";
    } else if (index < current) {
      state = "done";
    } else if (index === current) {
      state = "current";
    } else {
      state = "pending";
    }
    return { label, state, caption: CAPTIONS[state] };
  });
}

export interface LogEntry {
  at: string;
  text: string;
}

/** Nhật ký rút ra từ các mốc thời gian có trong hồ sơ; mới nhất ở trên. */
export function deriveLog(record: DeathCase | null | undefined): LogEntry[] {
  if (!record) return [];
  const entries: LogEntry[] = [{ at: record.createdAt, text: "Bạn mở hồ sơ báo tin" }];
  const version = record.currentVersion;
  if (version.submittedAt) {
    entries.push({ at: version.submittedAt, text: `Bạn gửi hồ sơ (bản ${version.versionNo})` });
  }
  if (record.ownerNotice?.deliveredAt) {
    entries.push({ at: record.ownerNotice.deliveredAt, text: "Hệ thống đã nhắn cho Chủ kho" });
  } else if (record.ownerNotice?.status === "FAILED" && record.updatedAt) {
    entries.push({ at: record.updatedAt, text: "Chưa gửi được thông báo cho Chủ kho" });
  }
  if (record.supplementRequest) {
    entries.push({
      at: record.supplementRequest.requestedAt,
      text: "Người xét duyệt yêu cầu bổ sung",
    });
  }
  if (record.status === "REJECTED" && record.updatedAt) {
    entries.push({ at: record.updatedAt, text: "Hồ sơ bị từ chối" });
  }
  if (record.status === "APPROVED_FOR_HANDOVER" && record.updatedAt) {
    entries.push({ at: record.updatedAt, text: "Hồ sơ được duyệt để bàn giao" });
  }
  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
