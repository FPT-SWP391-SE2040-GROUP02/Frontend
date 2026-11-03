import type { ReactNode } from "react";
import { Check } from "lucide-react";

/**
 * Ba bước theo thứ tự Backend bắt buộc: đọc căn cước → thử thách camera → so khớp khuôn mặt.
 * (Backend chỉ so khớp sau khi thử thách camera đã đạt, nên camera đứng trước.)
 */
const STEPS = [
  { title: "Đọc căn cước", hint: "Thông tin và nơi cư trú" },
  { title: "Kiểm tra camera", hint: "Thử thách trực tiếp" },
  { title: "So khớp khuôn mặt", hint: "Căn cước và ảnh chân dung" },
];

/** Thanh tiến trình: bước đã xong có dấu tích, bước hiện tại tô đậm, bước sau nét đứt. */
export function EkycStepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  const items: ReactNode[] = [];
  let index = 0;
  for (const step of STEPS) {
    index = index + 1;
    const done = index < current;
    const active = index === current;
    let circle = "border border-heritage-border bg-heritage-surface text-heritage-muted";
    let content: ReactNode = index;
    if (done) {
      circle = "bg-green-600 text-white";
      content = <Check className="size-5" aria-hidden="true" />;
    } else if (active) {
      circle = "bg-[#1d4d3c] text-white ring-4 ring-green-200";
    }
    // Đoạn nối bên trái nối với bước trước (đã xong thì liền xanh); bước đầu không có đoạn nối trái.
    let leftLine = "";
    if (index > 1) {
      leftLine = lineFor(index - 1, current);
    }
    let rightLine = "";
    if (index < STEPS.length) {
      rightLine = lineFor(index, current);
    }
    items.push(
      <li
        key={step.title}
        aria-current={active ? "step" : undefined}
        className="flex flex-1 flex-col items-center text-center"
      >
        <div className="flex w-full items-center">
          <div className={`flex-1 ${leftLine}`} />
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-full text-base font-semibold ${circle}`}
          >
            {content}
          </span>
          <div className={`flex-1 ${rightLine}`} />
        </div>
        <p className="mt-3 text-sm font-semibold">{step.title}</p>
        <p className="text-xs text-heritage-muted">{step.hint}</p>
      </li>,
    );
  }
  return (
    <ol
      aria-label="Các bước xác minh"
      className="flex rounded-2xl border border-heritage-border bg-heritage-surface px-4 py-6"
    >
      {items}
    </ol>
  );
}

/** Đoạn nối sau bước `index`: liền xanh nếu bước đó đã xong, nét đứt nếu chưa. */
function lineFor(index: number, current: number): string {
  if (index < current) {
    return "border-t-2 border-green-600";
  }
  return "border-t-2 border-dashed border-heritage-border";
}
