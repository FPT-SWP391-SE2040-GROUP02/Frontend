import {
  resolveCurrentStep,
  type WizardResolution,
  type WizardStep,
  type WizardStepState,
} from "@/shared/ui/wizard";
import { currentHandoverStep } from "@/features/handover/model/handoverStep";

export const RECIPIENT_STEP_IDS = ["invitation", "identity", "decision", "download"] as const;
export type RecipientStepId = (typeof RECIPIENT_STEP_IDS)[number];

/** Trạng thái lượt bàn giao đầu tiên của người nhận; null khi chưa tải được lượt nào. */
export interface RecipientStepInput {
  /** null: đang tải hoặc query lỗi. [] : đã tải, chưa có lời mời. */
  turnStatuses: readonly string[] | null;
}

const COPY: Record<RecipientStepId, { title: string; hint: string }> = {
  invitation: {
    title: "Lời mời này là gì",
    hint: "Xem ai để lại gì cho bạn, gồm những mục nào.",
  },
  identity: {
    title: "Xác minh danh tính",
    hint: "Chụp CCCD và khuôn mặt để chứng minh bạn đúng là người nhận.",
  },
  decision: {
    title: "Đồng ý hoặc từ chối nhận",
    hint: "Bạn quyết định có nhận hay không. Sau khi đồng ý, nội dung mới mở ra cho bạn.",
  },
  download: {
    title: "Tải tài sản",
    hint: "Tải về trong thời gian còn hiệu lực. Hết hạn thì không tải được nữa.",
  },
};

function stepsFor(status: string): Record<RecipientStepId, WizardStepState> {
  const step = currentHandoverStep(status as Parameters<typeof currentHandoverStep>[0]);
  if (step === null) {
    // Lượt đã kết thúc không thành công: không còn việc để làm.
    return { invitation: "done", identity: "blocked", decision: "blocked", download: "blocked" };
  }
  if (step === 4) {
    return { invitation: "done", identity: "todo", decision: "blocked", download: "blocked" };
  }
  if (step === 5) {
    return { invitation: "done", identity: "done", decision: "todo", download: "blocked" };
  }
  return { invitation: "done", identity: "done", decision: "done", download: "todo" };
}

/** Bốn bước của Người nhận, chỉ từ trạng thái lượt bàn giao do máy chủ trả về. */
export function resolveRecipientSteps(input: RecipientStepInput): WizardResolution {
  let states: Record<RecipientStepId, WizardStepState>;
  if (input.turnStatuses === null) {
    states = {
      invitation: "unknown",
      identity: "unknown",
      decision: "unknown",
      download: "unknown",
    };
  } else if (input.turnStatuses.length === 0) {
    states = { invitation: "todo", identity: "blocked", decision: "blocked", download: "blocked" };
  } else {
    states = stepsFor(input.turnStatuses[0]);
  }
  const steps: WizardStep[] = RECIPIENT_STEP_IDS.map((id) => ({
    id,
    title: COPY[id].title,
    hint: COPY[id].hint,
    state: states[id],
  }));
  return resolveCurrentStep(steps);
}
