import { Check } from "lucide-react";
import { Panel } from "@/shared/ui/heritageKit";
import type { ExecutorVault } from "../model/deathCase.schema";
import { vaultJourney, type CaseStatus, type JourneyState } from "../model/executorTodo";
import type { HandoverProgress } from "../model/handoverProgress.schema";

const circleStyles: Record<JourneyState, string> = {
  done: "border-[#1F7A55] bg-[#1F7A55] text-white",
  current: "border-[#C9A55C] bg-[#E0C486] text-[#0A281E]",
  pending: "border-[#BDB8A6] bg-white text-heritage-muted",
};

const captionStyles: Record<JourneyState, string> = {
  done: "text-[#1F7A55]",
  current: "text-[#7A5B25]",
  pending: "text-heritage-muted",
};

/**
 * "Kho đang ở đâu": chỉ 3 bước của cả kho (Báo tin, Người xét duyệt duyệt, Bàn giao cho người nhận).
 * Tiến độ từng người nhận nằm ở trang Bàn giao, không lặp lại ở đây.
 */
export function VaultJourney({
  vault,
  caseStatus,
  progress,
}: {
  vault: ExecutorVault;
  caseStatus: CaseStatus | null;
  progress: HandoverProgress | null;
}) {
  const steps = vaultJourney(vault, caseStatus, progress);
  return (
    <Panel title="Kho đang ở đâu">
      <ol className="grid gap-5 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.label}
            aria-current={step.state === "current" ? "step" : undefined}
            className="flex items-center gap-3"
          >
            <span
              aria-hidden="true"
              className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${circleStyles[step.state]}`}
            >
              {step.state === "done" ? <Check className="size-5" /> : index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{step.label}</span>
              <span className={`block text-xs font-medium ${captionStyles[step.state]}`}>
                {step.caption}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
