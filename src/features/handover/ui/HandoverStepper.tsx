import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { RECEIVE_STEP_ROLES, RECEIVE_STEP_TITLES } from "@/entities/handoverRecord";

/**
 * Sáu bước của người nhận cho một lượt bàn giao: xong, đang ở đây, chờ (kèm ai làm bước đó). current = 7 khi đã xong hết.
 * `warn` tô bước hiện tại màu vàng cam khi bước đó đang cần làm lại (luật sư yêu cầu nộp lại căn cước).
 * Từ màn rộng, các vòng tròn nối với nhau bằng một đường; đường xanh tới hết bước đang làm.
 * Chuyển động: các vòng đã xong nảy ra lần lượt, dấu tích tự vẽ, đường nối đổ đầy từ trái sang, bước hiện tại có vòng sóng
 * lan ra. Đổi bước (`current` đổi) thì dựng lại để chuyển động chạy lại ngay chỗ vừa tới.
 */
export function HandoverStepper({ current, warn = false }: { current: number; warn?: boolean }) {
  return (
    <ol
      key={current}
      className="grid grid-cols-2 gap-x-2 gap-y-6 sm:grid-cols-3 xl:grid-cols-6"
      aria-label="Tiến trình bàn giao"
    >
      {RECEIVE_STEP_TITLES.map((label, index) => {
        const number = index + 1;
        const done = number < current;
        const here = number === current;
        let caption = RECEIVE_STEP_ROLES[index].label;
        if (done) caption = "Xong";
        if (here) caption = "Đang ở đây";
        let circle = "border-2 border-heritage-border bg-white text-heritage-muted";
        if (done) circle = "border-2 border-heritage-success bg-heritage-success text-white";
        if (here) {
          circle = warn
            ? "pm-here border-2 border-heritage-warning bg-heritage-warning text-white ring-4 ring-heritage-warning-bg"
            : "pm-here border-2 border-heritage-primary bg-heritage-primary text-white ring-4 ring-heritage-gold/35";
        }
        let captionTone = "text-heritage-muted";
        if (done) captionTone = "font-semibold text-heritage-success";
        if (here)
          captionTone = warn
            ? "font-bold text-heritage-warning"
            : "font-bold text-heritage-gold-hover";
        const lit = done || here;
        const style = { "--pm-i": index } as CSSProperties;
        return (
          <li
            key={label}
            aria-current={here ? "step" : undefined}
            style={style}
            className="relative flex flex-col items-center gap-2 px-1 text-center"
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className="absolute left-[calc(-50%-8px)] top-[19px] hidden h-0.5 w-[calc(100%+8px)] bg-heritage-border xl:block"
              >
                {lit && (
                  <span className="pm-fill block size-full bg-heritage-success" style={style} />
                )}
              </span>
            )}
            <span
              className={`${done ? "pm-pop" : ""} relative z-10 flex size-10 items-center justify-center rounded-full text-sm font-semibold ${circle}`}
              style={style}
            >
              {done ? <Check className="pm-check size-5" aria-hidden="true" /> : number}
            </span>
            <span className="text-sm font-semibold leading-snug text-heritage-primary">
              {label}
            </span>
            <span className={`text-xs ${captionTone}`}>{caption}</span>
          </li>
        );
      })}
    </ol>
  );
}
