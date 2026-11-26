import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
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
  body: "pm-rows divide-y divide-heritage-border",
  td: "px-5 py-3",
};

/**
 * Thẻ có đầu mục tách bằng vạch ngang; phần thân tự quyết lề để bảng và danh sách chạy sát mép.
 * Khi `collapsible`, đầu mục có nút mũi tên Mở/Thu gọn; lúc thu gọn thì ẩn cả thân lẫn `action`
 * (thân vẫn được giữ trong cây để không mất dữ liệu đang nhập).
 */
export function SectionCard({
  title,
  subtitle,
  action,
  labelledBy,
  children,
  className,
  collapsible = false,
  defaultOpen = true,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  labelledBy: string;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  let expanded = true;
  if (collapsible) {
    expanded = open;
  }
  let toggleLabel = "Mở";
  let chevronClass = "size-4 transition-transform";
  if (expanded) {
    toggleLabel = "Thu gọn";
    chevronClass = "size-4 rotate-180 transition-transform";
  }
  const heading = (
    <div className={cn("min-w-0", collapsible && "flex-1")}>
      <h2 id={labelledBy} className="text-base font-bold text-heritage-primary">
        {title}
      </h2>
      {subtitle && <p className="mt-0.5 text-sm text-heritage-muted">{subtitle}</p>}
    </div>
  );
  let header = (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-heritage-border px-5 py-3.5">
      {heading}
      {action}
    </div>
  );
  if (collapsible) {
    // Nút Mở/Thu gọn luôn ở góc phải hàng tiêu đề; nút việc của mục xuống hàng riêng để tiêu đề không bị ép hẹp.
    header = (
      <div className={cn("px-5 py-3.5", expanded && "border-b border-heritage-border")}>
        <div className="flex items-center justify-between gap-3">
          {heading}
          <button
            type="button"
            className={cn(compactButton.outline, "shrink-0")}
            aria-expanded={expanded}
            aria-controls={bodyId}
            onClick={() => setOpen(!open)}
          >
            {toggleLabel}
            <ChevronDown className={chevronClass} aria-hidden="true" />
          </button>
        </div>
        {expanded && action && <div className="mt-3">{action}</div>}
      </div>
    );
  }
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn(
        "pm-rise min-w-0 overflow-hidden rounded-2xl border border-heritage-border bg-heritage-surface",
        className,
      )}
    >
      {header}
      <div id={bodyId} hidden={!expanded}>
        {children}
      </div>
    </section>
  );
}
