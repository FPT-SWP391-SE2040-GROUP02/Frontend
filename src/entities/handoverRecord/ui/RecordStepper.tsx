import { Check } from "lucide-react";
import { cn } from "cn";
import type { RecordStatus } from "../model/handoverRecord.schema";
import { currentStepIndex, recordSteps } from "../model/recordPresentation";

/** Thanh ba bước của biên bản: bước đã xong có dấu tích, bước đang làm được tô, bước sau còn khóa. */
export function RecordStepper({ status }: { status: RecordStatus }) {
  const current = currentStepIndex(status);
  return (
    <ol aria-label="Các bước của biên bản" className="grid gap-3 sm:grid-cols-3">
      {recordSteps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={step.key}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4",
              active
                ? "border-heritage-gold bg-heritage-sunken"
                : "border-heritage-border bg-heritage-surface",
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                done
                  ? "bg-heritage-success-bg text-heritage-success"
                  : "bg-heritage-sunken text-heritage-muted",
              )}
            >
              {done ? <Check aria-hidden className="size-4" /> : index + 1}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-heritage-primary">{step.title}</span>
              <span className="block text-sm text-heritage-muted">
                {done ? "Đã xong" : active ? step.hint : "Chưa mở"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
