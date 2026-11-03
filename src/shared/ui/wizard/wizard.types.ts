/** "unknown": query lỗi hoặc đang tải, không được hiện như đã xong. */
export type WizardStepState = "done" | "current" | "todo" | "blocked" | "unknown";

export interface WizardStep {
  id: string;
  /** Câu ngắn, đời thường, không thuật ngữ kỹ thuật. */
  title: string;
  /** Một câu giải thích vì sao cần bước này. */
  hint: string;
  state: WizardStepState;
}

export interface WizardResolution {
  steps: WizardStep[];
  /** Bước chưa xong đầu tiên; null nghĩa là đã xong hết. */
  currentId: string | null;
}

/**
 * Chọn bước chưa xong đầu tiên và đánh dấu "current".
 * Bước "unknown" vẫn được coi là chưa xong để không bao giờ nhảy cóc qua dữ liệu chưa kiểm tra được.
 */
export function resolveCurrentStep(steps: WizardStep[]): WizardResolution {
  let currentId: string | null = null;
  const resolved = steps.map((step) => {
    const open = step.state === "todo" || step.state === "unknown";
    if (open && currentId === null) {
      currentId = step.id;
      if (step.state === "todo") {
        return { ...step, state: "current" as const };
      }
    }
    return step;
  });
  return { steps: resolved, currentId };
}
