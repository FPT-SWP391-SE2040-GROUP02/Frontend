import {
  resolveCurrentStep,
  type WizardResolution,
  type WizardStep,
  type WizardStepState,
} from "@/shared/ui/wizard";

export const EXECUTOR_STEP_IDS = ["accepted", "waiting", "report", "progress"] as const;
export type ExecutorStepId = (typeof EXECUTOR_STEP_IDS)[number];

export interface ExecutorStepInput {
  /** Số kho được phân công; null khi chưa tải được. */
  vaultsCount: number | null;
  /** Kho đang làm việc; null khi chưa chọn hoặc chưa có. */
  vault: { checkInOverdue: boolean; openDeathCaseId: string | null } | null;
  /** Trạng thái hồ sơ báo tử của kho; null khi chưa có hồ sơ. */
  caseStatus: string | null;
  /** Kết quả currentStepIndex (0–5, 6 = xong hết, -1 = không chạy); null khi chưa biết. */
  progressIndex: number | null;
}

const COPY: Record<ExecutorStepId, { title: string; hint: string }> = {
  accepted: {
    title: "Đã nhận nhiệm vụ",
    hint: "Đọc phạm vi vai trò: bạn báo tin khi Chủ kho không còn, không xem được tài sản.",
  },
  waiting: {
    title: "Chờ đến khi cần báo tin",
    hint: "Chưa có việc gì. Việc chỉ xuất hiện khi Chủ kho quá hạn điểm danh và hết thời gian gia hạn.",
  },
  report: {
    title: "Báo tin",
    hint: "Nộp hồ sơ báo tử kèm giấy chứng tử để Người xét duyệt kiểm tra.",
  },
  progress: {
    title: "Theo dõi tiến trình",
    hint: "Xem hồ sơ đang ở bước nào. Từ đây bạn không cần làm gì thêm.",
  },
};

function reportState(input: ExecutorStepInput, waitingDone: boolean): WizardStepState {
  if (!waitingDone) return "blocked";
  if (input.caseStatus === null || input.caseStatus === "DRAFT") return "todo";
  if (input.caseStatus === "SUPPLEMENT_REQUIRED") return "todo";
  return "done";
}

function progressState(input: ExecutorStepInput, reportDone: boolean): WizardStepState {
  if (!reportDone) return "blocked";
  if (input.progressIndex === null) return "unknown";
  if (input.progressIndex >= 6) return "done";
  return "todo";
}

/** Bốn bước của Người thực hiện, chỉ từ kho, hồ sơ và tiến độ do máy chủ trả về. */
export function resolveExecutorSteps(input: ExecutorStepInput): WizardResolution {
  let states: Record<ExecutorStepId, WizardStepState>;
  if (input.vaultsCount === null) {
    states = { accepted: "unknown", waiting: "unknown", report: "unknown", progress: "unknown" };
  } else if (input.vaultsCount === 0) {
    states = { accepted: "todo", waiting: "blocked", report: "blocked", progress: "blocked" };
  } else {
    const waitingDone =
      input.vault !== null && (input.vault.checkInOverdue || input.vault.openDeathCaseId !== null);
    let waiting: WizardStepState = "todo";
    if (waitingDone) waiting = "done";
    const report = reportState(input, waitingDone);
    states = {
      accepted: "done",
      waiting,
      report,
      progress: progressState(input, report === "done"),
    };
  }
  const steps: WizardStep[] = EXECUTOR_STEP_IDS.map((id) => ({
    id,
    title: COPY[id].title,
    hint: COPY[id].hint,
    state: states[id],
  }));
  return resolveCurrentStep(steps);
}
