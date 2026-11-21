import { Check } from "lucide-react";
const stepLabels = ["Đồng ý hoặc từ chối", "Xét duyệt", "Nhập mã và mở gói"];

/** Ba bước của người nhận: xong, đang ở đây, chờ. Không có bước "Nhận thư mời" (nhận lượt chạy ngầm). */
export function HandoverStepper({ current }: { current: number }) {
  return (
    <ol className="grid grid-cols-3 gap-y-6" aria-label="Tiến trình bàn giao">
      {stepLabels.map((label, index) => {
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
