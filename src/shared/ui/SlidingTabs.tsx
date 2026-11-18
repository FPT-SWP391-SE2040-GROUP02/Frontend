import { useLayoutEffect, useRef } from "react";

export interface SlidingTab<K extends string> {
  key: K;
  label: string;
}

export interface SlidingTabsProps<K extends string> {
  /** Tên của cả thanh tab cho trình đọc màn hình. */
  label: string;
  tabs: SlidingTab<K>[];
  value: K;
  onChange: (key: K) => void;
}

const TAB_BASE =
  "relative z-10 inline-flex min-h-9 items-center rounded-lg px-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-heritage-gold motion-reduce:transition-none";

/**
 * Thanh tab dạng viên: nền của tab đang chọn là một khối trượt sang tab mới khi đổi tab. Chỉ có hai thuộc tính đổi
 * là transform (vị trí) và width (tab hai bên rộng khác nhau); khối là phần tử tuyệt đối nên đổi width không làm
 * trang dàn lại. Người chọn giảm chuyển động thì khối nhảy ngay.
 */
export function SlidingTabs<K extends string>({
  label,
  tabs,
  value,
  onChange,
}: SlidingTabsProps<K>) {
  const listRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const placed = useRef(false);

  useLayoutEffect(() => {
    const list = listRef.current;
    const pill = pillRef.current;
    if (list === null || pill === null) {
      return undefined;
    }

    function place(animate: boolean): void {
      if (pill === null) {
        return;
      }
      const active = tabRefs.current.get(value);
      if (active === undefined) {
        pill.style.visibility = "hidden";
        return;
      }
      pill.style.visibility = "visible";
      const transform = `translateX(${active.offsetLeft}px)`;
      const width = `${active.offsetWidth}px`;
      if (pill.style.transform === transform && pill.style.width === width) {
        // Đã đúng chỗ: không đặt lại, kẻo cắt chuyển động đang chạy (React StrictMode chạy hiệu ứng hai lần lúc dev).
        return;
      }
      if (!animate) {
        pill.style.transition = "none";
      }
      pill.style.transform = transform;
      pill.style.width = width;
      if (!animate) {
        // Ép tính lại kiểu để bước nhảy không bị chuyển động bắt lấy, rồi trả lại transition trong CSS.
        void pill.offsetHeight;
        pill.style.transition = "";
      }
    }

    // Lần đầu hiện ngay tại chỗ; các lần đổi tab sau mới trượt.
    place(placed.current);
    placed.current = true;

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }
    // Đổi kích thước (tải xong phông chữ, xoay màn hình) thì đặt lại vị trí, không trượt.
    const observer = new ResizeObserver(() => place(false));
    observer.observe(list);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      className="relative inline-flex gap-1 rounded-xl border border-heritage-border bg-heritage-surface p-1"
    >
      <span
        ref={pillRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 left-0 top-1 rounded-lg bg-heritage-primary transition-[transform,width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
      />
      {tabs.map((tab) => {
        const selected = tab.key === value;
        let colors = "text-heritage-muted hover:text-heritage-primary";
        if (selected) {
          colors = "text-white";
        }
        return (
          <button
            key={tab.key}
            ref={(node) => {
              if (node === null) {
                tabRefs.current.delete(tab.key);
              } else {
                tabRefs.current.set(tab.key, node);
              }
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`${TAB_BASE} ${colors}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
