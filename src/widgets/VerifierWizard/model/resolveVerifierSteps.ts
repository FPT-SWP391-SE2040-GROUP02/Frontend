import {
  resolveCurrentStep,
  type WizardResolution,
  type WizardStep,
  type WizardStepState,
} from "@/shared/ui/wizard";

export const VERIFIER_STEP_IDS = ["pick", "documents", "warnings", "decision"] as const;
export type VerifierStepId = (typeof VERIFIER_STEP_IDS)[number];

export interface VerifierStepInput {
  caseId: string | null;
  /** Trạng thái hồ sơ máy chủ trả về; null khi chưa tải được. */
  caseStatus: string | null;
  /** Hai mốc này chỉ lưu trên màn hình, không gửi lên máy chủ. */
  viewedDocuments: boolean;
  readWarnings: boolean;
}

const COPY: Record<VerifierStepId, { title: string; hint: string }> = {
  pick: {
    title: "Chọn hồ sơ trong hàng chờ",
    hint: "Chọn một hồ sơ báo tin đang chờ bạn. Bạn chỉ xác nhận hồ sơ, không xem nội dung kho.",
  },
  documents: {
    title: "Xem giấy tờ",
    hint: "Đọc giấy chứng tử và giấy tờ Người thực hiện nộp.",
  },
  warnings: {
    title: "Đọc cảnh báo của hệ thống",
    hint: "Hệ thống đánh dấu những điểm bất thường để bạn cân nhắc trước khi quyết định.",
  },
  decision: {
    title: "Quyết định",
    hint: "Duyệt, yêu cầu bổ sung hoặc từ chối. Bắt buộc ghi lý do.",
  },
};

/** Bốn bước của Người xét duyệt. Bước 2–3 là mốc tự bấm; bước 4 chỉ xong khi máy chủ đã chốt quyết định. */
export function resolveVerifierSteps(input: VerifierStepInput): WizardResolution {
  const hasCase = input.caseId !== null;
  let documents: WizardStepState = "blocked";
  let warnings: WizardStepState = "blocked";
  let decision: WizardStepState = "blocked";
  if (hasCase && input.viewedDocuments) documents = "done";
  if (hasCase && !input.viewedDocuments) documents = "todo";
  if (documents === "done" && input.readWarnings) warnings = "done";
  if (documents === "done" && !input.readWarnings) warnings = "todo";
  if (warnings === "done") {
    decision = "todo";
    if (input.caseStatus === null) decision = "unknown";
    if (input.caseStatus !== null && input.caseStatus !== "UNDER_REVIEW") decision = "done";
  }
  const states: Record<VerifierStepId, WizardStepState> = {
    pick: "todo",
    documents,
    warnings,
    decision,
  };
  if (hasCase) states.pick = "done";
  const steps: WizardStep[] = VERIFIER_STEP_IDS.map((id) => ({
    id,
    title: COPY[id].title,
    hint: COPY[id].hint,
    state: states[id],
  }));
  return resolveCurrentStep(steps);
}
