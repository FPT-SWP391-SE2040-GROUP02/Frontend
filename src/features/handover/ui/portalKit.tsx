import { cn } from "cn";
import type { TurnDot } from "../model/turnPresentation";

/** Khối giao diện riêng của cổng người nhận (chấm trạng thái, thanh bước nhỏ). */

const dotTones: Record<TurnDot, string> = {
  warn: "bg-[#e3a43a]",
  ok: "bg-[#4fbf8d]",
  bad: "bg-[#ee7167]",
  info: "bg-[#6fb1db]",
  none: "bg-[#6c8277]",
};

/** Chấm màu nhỏ báo trạng thái một lượt ở cột trái. */
export function StatusDot({ dot }: { dot: TurnDot }) {
  return (
    <span aria-hidden="true" className={cn("size-[9px] shrink-0 rounded-full", dotTones[dot])} />
  );
}

/** Thanh sáu đoạn nhỏ: xanh là bước đã xong, vàng là bước đang làm, xám là bước chờ. */
export function MiniStepBar({ step }: { step: number | null }) {
  return (
    <div aria-hidden="true" className="mt-2.5 flex max-w-[260px] gap-1">
      {[1, 2, 3, 4, 5, 6].map((n) => {
        let tone = "bg-heritage-border";
        if (step !== null && n < step) tone = "bg-heritage-success";
        if (step === n) tone = "bg-heritage-gold";
        return <span key={n} className={cn("h-[5px] flex-1 rounded-sm", tone)} />;
      })}
    </div>
  );
}
