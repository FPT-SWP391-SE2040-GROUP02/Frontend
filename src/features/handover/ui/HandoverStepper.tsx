import { Check } from "lucide-react";
import { RECEIVE_STEP_TITLES } from "@/entities/handoverRecord";

/** Sáu bước của người nhận cho một lượt bàn giao: xong, đang ở đây, chờ. current = 7 khi đã xong hết. */
export function HandoverStepper({ current }: { current: number }) {
  return (
    <ol
      className="grid grid-cols-2 gap-y-6 sm:grid-cols-3 xl:grid-cols-6"
      aria-label="Tiến trình bàn giao"
    >
      {RECEIVE_STEP_TITLES.map((label, index) => {
        const number = index + 1;
        const done = number < current;
        const here = number === current;
        let caption = "Chờ";
        if (done) caption = "Xong";
        if (here) caption = "Đang ở đây";
        let circle = "border border-heritage-border-strong bg-white text-heritage-muted";
        if (done) circle = "bg-heritage-success text-white";
        if (here) circle = "bg-heritage-primary text-white ring-4 ring-heritage-success-border";
        return (
          <li
            key={label}
            aria-current={here ? "step" : undefined}
            className="flex flex-col items-center gap-2 px-1 text-center"
          >
            <span
              className={`flex size-11 items-center justify-center rounded-full text-sm font-semibold ${circle}`}
            >
              {done ? <Check className="size-5" aria-hidden="true" /> : number}
            </span>
            <span className="text-sm font-semibold text-heritage-primary">{label}</span>
            <span
              className={`text-sm ${done || here ? "font-semibold text-heritage-success" : "text-heritage-muted"}`}
            >
              {caption}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
