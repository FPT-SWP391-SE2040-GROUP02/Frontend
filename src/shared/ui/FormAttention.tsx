// Lucian UX/UI Prompt #244 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#244
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "cn";
import "./formAttention.css";

/** Thời gian cuộn tới ô sai và khoảng chừa phía trên ô, giữ như mẫu gốc. */
const SCROLL_MS = 520;
const SCROLL_OFFSET = 70;

function prefersReducedMotion(): boolean {
  if (!window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Khung cuộn gần nhất chứa phần tử (hộp thoại, hoặc cả trang thì trả null). */
function findScroller(element: HTMLElement): HTMLElement | null {
  let node = element.parentElement;
  while (node !== null) {
    const overflow = window.getComputedStyle(node).overflowY;
    const scrollable = overflow === "auto" || overflow === "scroll";
    if (scrollable && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/** Cuộn mượt tới ô của `inputId` rồi đặt con trỏ vào đó. */
export function jumpToField(inputId: string): void {
  const input = document.getElementById(inputId);
  if (input === null) {
    return;
  }
  const field = input.closest<HTMLElement>("[data-field]") ?? input;
  const focus = () => input.focus({ preventScroll: true });
  const scroller = findScroller(field);
  if (scroller === null) {
    field.scrollIntoView?.({ block: "nearest" });
    focus();
    return;
  }
  const from = scroller.scrollTop;
  const distance =
    field.getBoundingClientRect().top - scroller.getBoundingClientRect().top - SCROLL_OFFSET;
  const to = Math.max(0, from + distance);
  if (prefersReducedMotion()) {
    scroller.scrollTop = to;
    focus();
    return;
  }
  const startedAt = performance.now();
  const step = (now: number) => {
    const done = Math.min(1, Math.max(0, (now - startedAt) / SCROLL_MS));
    const eased = 1 - Math.pow(1 - done, 3);
    scroller.scrollTop = from + (to - from) * eased;
    if (done < 1) {
      requestAnimationFrame(step);
      return;
    }
    focus();
  };
  requestAnimationFrame(step);
}

export interface SummaryItem {
  inputId: string;
  label: string;
  fixed: boolean;
}

/** Khung "Còn N ô cần sửa" thả xuống đầu form; bấm tên ô thì nhảy tới ô đó, sửa xong thì gạch tên. */
export function ErrorSummary({ items }: { items: SummaryItem[] }) {
  const remaining = items.filter((item) => !item.fixed).length;
  const open = remaining > 0;
  return (
    <div className={cn("u244-sm", open && "is-open")} role={open ? "alert" : undefined}>
      <div>
        {items.length > 0 && (
          <div className="u244-sb">
            <p className="u244-title">
              <i aria-hidden="true">!</i>
              {`Còn ${remaining} ô cần sửa`}
            </p>
            <ul>
              {items.map((item) => (
                <li key={item.inputId} className={cn(item.fixed && "is-fixed")}>
                  <button type="button" disabled={!open} onClick={() => jumpToField(item.inputId)}>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Một ô nhập: nhãn, ô, gợi ý một dòng. Lỗi thì câu lỗi trượt ra thế chỗ gợi ý và ô rung; sửa đúng thì hiện dấu tích.
 * Ô bên trong nhận `id={inputId}` và `aria-describedby={describedBy(...)}` từ nơi dùng.
 */
export function AttentionField({
  inputId,
  label,
  optional = false,
  hint,
  error,
  good = false,
  shake = 0,
  checkClassName,
  className,
  children,
}: {
  inputId: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  good?: boolean;
  /** Tăng lên một đơn vị thì ô rung một lần. */
  shake?: number;
  checkClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  const field = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = field.current;
    if (node === null || shake === 0) {
      return;
    }
    // Gỡ rồi gắn lại class để chuyển động chạy lại ở lần bấm sau.
    node.classList.remove("is-shake");
    void node.offsetWidth;
    node.classList.add("is-shake");
  }, [shake]);
  const bad = Boolean(error);
  return (
    <div
      ref={field}
      data-field=""
      className={cn("u244-fd", bad && "is-bad", !bad && good && "is-good", className)}
    >
      <label htmlFor={inputId} className="block text-sm font-semibold">
        {label}
        {optional && <span className="font-normal text-heritage-muted"> (không bắt buộc)</span>}
      </label>
      <div className="u244-bx">
        {children}
        <span className={cn("u244-ok", checkClassName)} aria-hidden="true" />
      </div>
      {hint && !bad && (
        <div id={`${inputId}-hint`} className="pt-1.5 text-sm text-heritage-muted">
          {hint}
        </div>
      )}
      <div className="u244-ms">
        <div>
          {bad && (
            <p id={`${inputId}-error`} className="pt-1.5 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
