import { Check, HelpCircle, Lock } from "lucide-react";
import { cn } from "cn";
import type { WizardStepState } from "./wizard/wizard.types";

export interface StepperStep {
  id: string;
  label: string;
  /** Dòng nhỏ dưới tên bước (chỉ hiện ở kiểu ngang). */
  hint?: string;
  state: WizardStepState;
}

export interface StepperProps {
  steps: StepperStep[];
  /** Tên vùng cho trình đọc màn hình, ví dụ "Các bước". */
  ariaLabel: string;
  orientation?: "horizontal" | "vertical";
  /** Bước đang mở (kiểu dọc tô viền). Bước có state `current` luôn được đánh dấu `aria-current`. */
  activeId?: string;
  /** Có hàm này thì mỗi bước là một nút bấm được (kiểu dọc). */
  onSelect?: (id: string) => void;
  /** Kiểu ngang: hiện chữ trạng thái dưới tên bước thay vì chỉ cho trình đọc màn hình. */
  showState?: boolean;
  /** Đổi chữ trạng thái cho một màn cụ thể. */
  stateLabels?: Partial<Record<WizardStepState, string>>;
  className?: string;
}

/** Chữ trạng thái mặc định, dùng chung cho mọi màn có các bước. */
export const STEP_STATE_LABEL: Record<WizardStepState, string> = {
  done: "Xong",
  current: "Đang làm",
  todo: "Chưa làm",
  blocked: "Bị chặn",
  unknown: "Chưa kiểm tra được",
};

function StepMarker({
  state,
  index,
  large,
}: {
  state: WizardStepState;
  index: number;
  large: boolean;
}) {
  const base = cn(
    "flex shrink-0 items-center justify-center rounded-full text-sm font-semibold",
    large ? "size-11" : "size-8",
  );
  const icon = large ? "size-5" : "size-4";
  if (state === "done") {
    return (
      <span className={cn(base, "bg-heritage-success text-heritage-surface")} aria-hidden="true">
        <Check className={icon} />
      </span>
    );
  }
  if (state === "blocked") {
    return (
      <span className={cn(base, "bg-heritage-danger-bg text-heritage-danger")} aria-hidden="true">
        <Lock className={icon} />
      </span>
    );
  }
  if (state === "unknown") {
    return (
      <span className={cn(base, "bg-heritage-neutral-bg text-heritage-muted")} aria-hidden="true">
        <HelpCircle className={icon} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span
        className={cn(
          base,
          "bg-heritage-gold-soft text-heritage-on-gold",
          large && "ring-4 ring-heritage-gold-border",
        )}
        aria-hidden="true"
      >
        {index + 1}
      </span>
    );
  }
  return (
    <span
      className={cn(base, "border border-heritage-border text-heritage-muted")}
      aria-hidden="true"
    >
      {index + 1}
    </span>
  );
}

/**
 * Các bước của một việc dài: kiểu dọc cho cột bước cạnh nội dung, kiểu ngang cho thanh trên đầu trang.
 * Chỉ trình bày; trạng thái từng bước do nơi gọi tính từ dữ liệu máy chủ.
 */
export function Stepper({
  steps,
  ariaLabel,
  orientation = "horizontal",
  activeId,
  onSelect,
  showState = false,
  stateLabels,
  className,
}: StepperProps) {
  const labels = { ...STEP_STATE_LABEL, ...stateLabels };

  if (orientation === "vertical") {
    return (
      <ol
        aria-label={ariaLabel}
        className={cn(
          "flex gap-2 overflow-x-auto pb-2 md:flex-col md:gap-1 md:overflow-visible md:pb-0",
          className,
        )}
      >
        {steps.map((step, index) => {
          const active = step.id === activeId;
          const content = (
            <>
              <StepMarker state={step.state} index={index} large={false} />
              <span className="min-w-0 flex-1">
                <span className="block whitespace-nowrap md:whitespace-normal">{step.label}</span>
                <span className="sr-only">{labels[step.state]}</span>
              </span>
            </>
          );
          const itemClass = cn(
            "flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
            active && "border-heritage-primary bg-heritage-surface font-semibold",
            !active && "border-transparent",
          );
          return (
            <li key={step.id} className="shrink-0 md:shrink">
              {onSelect ? (
                <button
                  type="button"
                  aria-current={active ? "step" : undefined}
                  onClick={() => onSelect(step.id)}
                  className={cn(
                    itemClass,
                    "hover:bg-heritage-surface/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold",
                    !active && "hover:bg-heritage-surface/70",
                  )}
                >
                  {content}
                </button>
              ) : (
                <div aria-current={active ? "step" : undefined} className={itemClass}>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol aria-label={ariaLabel} className={cn("flex items-start overflow-x-auto", className)}>
      {steps.map((step, index) => {
        const here = step.state === "current" || step.id === activeId;
        const previousDone = index > 0 && steps[index - 1]?.state === "done";
        const lineBefore = previousDone ? "bg-heritage-success" : "bg-heritage-border";
        const lineAfter = step.state === "done" ? "bg-heritage-success" : "bg-heritage-border";
        return (
          <li
            key={step.id}
            aria-current={here ? "step" : undefined}
            className="flex min-w-[5.5rem] flex-1 flex-col items-center px-1 text-center"
          >
            <div className="flex w-full items-center">
              <div className={cn("h-0.5 flex-1", index === 0 ? "bg-transparent" : lineBefore)} />
              <StepMarker state={step.state} index={index} large />
              <div
                className={cn(
                  "h-0.5 flex-1",
                  index === steps.length - 1 ? "bg-transparent" : lineAfter,
                )}
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-heritage-primary">{step.label}</p>
            {step.hint && <p className="text-xs text-heritage-muted">{step.hint}</p>}
            {showState ? (
              <p
                className={cn(
                  "text-xs",
                  step.state === "done" || here
                    ? "font-semibold text-heritage-success"
                    : "text-heritage-muted",
                )}
              >
                {labels[step.state]}
              </p>
            ) : (
              <span className="sr-only">{labels[step.state]}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
