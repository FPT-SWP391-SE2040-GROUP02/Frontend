import {
  resolveCurrentStep,
  type WizardResolution,
  type WizardStep,
  type WizardStepState,
} from "@/shared/ui/wizard";

export const OWNER_STEP_IDS = [
  "assets",
  "identity",
  "service-tier",
  "recipients",
  "package",
  "executor",
  "activate",
  "done",
] as const;
export type OwnerStepId = (typeof OWNER_STEP_IDS)[number];

/** Dữ liệu máy chủ đã xác nhận; null nghĩa là chưa có (đang tải hoặc query lỗi). */
export interface OwnerStepInput {
  assetsCount: number | null;
  beneficiariesCount: number | null;
  setup: {
    planStatus: string;
    canActivate: boolean;
    missingRequirements: readonly string[];
  } | null;
}

const COPY: Record<OwnerStepId, { title: string; hint: string }> = {
  assets: {
    title: "Bạn muốn để lại gì?",
    hint: "Thêm ít nhất một tài sản: một tệp hoặc một lời nhắn bạn muốn trao lại.",
  },
  identity: {
    title: "Xác minh bạn là chính chủ",
    hint: "Chụp CCCD và khuôn mặt để chứng minh bạn là chính chủ.",
  },
  "service-tier": {
    title: "Chọn hạng dịch vụ",
    hint: "Kế hoạch cần một hạng dịch vụ trả phí còn hạn.",
  },
  recipients: {
    title: "Ai sẽ nhận?",
    hint: "Thêm người sẽ nhận gói bàn giao của bạn.",
  },
  package: {
    title: "Gói nào trao cho ai?",
    hint: "Gói bàn giao sẵn sàng khi có cả tài sản và người nhận.",
  },
  executor: {
    title: "Ai sẽ báo tin khi bạn không còn?",
    hint: "Người thực hiện báo tin khi bạn không còn. Họ không xem được tài sản.",
  },
  activate: {
    title: "Kích hoạt kế hoạch",
    hint: "Từ lúc này hệ thống bắt đầu đếm kỳ điểm danh.",
  },
  done: {
    title: "Hoàn tất: điểm danh lần đầu",
    hint: "Bấm xác nhận bạn vẫn ổn để bắt đầu kỳ điểm danh đầu tiên.",
  },
};

function fromRequirement(input: OwnerStepInput, code: string): WizardStepState {
  if (input.setup === null) return "unknown";
  if (input.setup.missingRequirements.includes(code)) return "todo";
  return "done";
}

function fromCount(count: number | null): WizardStepState {
  if (count === null) return "unknown";
  if (count > 0) return "done";
  return "todo";
}

function activateState(input: OwnerStepInput): WizardStepState {
  if (input.setup === null) return "unknown";
  if (input.setup.planStatus !== "DRAFT") return "done";
  if (!input.setup.canActivate) return "blocked";
  return "todo";
}

function finishState(input: OwnerStepInput): WizardStepState {
  if (input.setup === null) return "unknown";
  if (input.setup.planStatus === "DRAFT") return "blocked";
  return "todo";
}

/**
 * Tính trạng thái 7 bước + màn hoàn tất của Chủ kho, chỉ từ dữ liệu máy chủ.
 * Bước 1–6 làm theo thứ tự tùy ý; `currentId` là bước chưa xong đầu tiên.
 */
export function resolveOwnerSteps(input: OwnerStepInput): WizardResolution {
  const states: Record<OwnerStepId, WizardStepState> = {
    assets: fromCount(input.assetsCount),
    identity: fromRequirement(input, "OWNER_EKYC_REQUIRED"),
    "service-tier": fromRequirement(input, "PAID_SERVICE_REQUIRED"),
    recipients: fromCount(input.beneficiariesCount),
    package: fromRequirement(input, "READY_CONTAINER_REQUIRED"),
    executor: fromRequirement(input, "PRIMARY_EXECUTOR_REQUIRED"),
    activate: activateState(input),
    done: finishState(input),
  };
  const steps: WizardStep[] = OWNER_STEP_IDS.map((id) => ({
    id,
    title: COPY[id].title,
    hint: COPY[id].hint,
    state: states[id],
  }));
  return resolveCurrentStep(steps);
}

/** Số bước (1–7) chưa xong, dùng cho thẻ "Còn N bước" trên Tổng quan. */
export function countRemainingOwnerSteps(resolution: WizardResolution): number {
  return resolution.steps.filter((step) => step.id !== "done" && step.state !== "done").length;
}
