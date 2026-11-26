import type { ReactNode } from "react";
import { cn } from "cn";

const BUTTON =
  "inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold-hover disabled:pointer-events-none disabled:opacity-50";

/** Nút gọn cho màn làm việc nhiều hàng (bảng, thẻ có đầu mục). */
export const compactButton = {
  dark: `${BUTTON} border-heritage-primary bg-heritage-primary text-white hover:bg-heritage-primary-hover`,
  outline: `${BUTTON} border-heritage-border-strong bg-heritage-surface text-heritage-text hover:bg-heritage-sunken`,
  success: `${BUTTON} border-heritage-success bg-heritage-success text-white hover:opacity-90`,
  danger: `${BUTTON} border-heritage-danger-border bg-heritage-surface text-heritage-danger hover:bg-heritage-danger-bg`,
};

/** Kiểu bảng quản lý: hàng đầu nền kem, các dòng ngăn bằng vạch mảnh. */
export const tableStyles = {
  table: "w-full text-left text-sm",
  head: "border-b border-heritage-border bg-heritage-sunken text-heritage-muted",
  th: "px-5 py-2.5 font-semibold",
  body: "divide-y divide-heritage-border",
  td: "px-5 py-3",
};

/** Thẻ có đầu mục tách bằng vạch ngang; phần thân tự quyết lề để bảng và danh sách chạy sát mép. */
export function SectionCard({
  title,
  subtitle,
  action,
  labelledBy,
  children,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  labelledBy: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn(
        "min-w-0 overflow-hidden rounded-2xl border border-heritage-border bg-heritage-surface",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-heritage-border px-5 py-3.5">
        <div className="min-w-0">
          <h2 id={labelledBy} className="text-base font-bold text-heritage-primary">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-sm text-heritage-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
