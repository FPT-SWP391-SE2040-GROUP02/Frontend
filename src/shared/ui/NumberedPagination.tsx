import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageWindow } from "@/shared/lib/pageWindow";
import "./numbered-pagination.css";

/** Lucian UX/UI Prompt #449 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#449 */

/** Bước dịch của viên thuốc: bề rộng một ô và khoảng cách giữa hai ô (khớp numbered-pagination.css). */
const SLOT_STEP = 38;

/** Một ô số: chữ cũ trượt ra, chữ mới trượt vào khi giá trị đổi (xuống khi tiến, lên khi lùi). */
function RollingText({ text }: { text: string }) {
  const [shown, setShown] = useState(text);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  if (text !== shown) {
    setLeaving(shown);
    setShown(text);
    setChanged(true);
  }
  useEffect(() => {
    if (leaving === null) {
      return;
    }
    const timer = window.setTimeout(() => setLeaving(null), 320);
    return () => window.clearTimeout(timer);
  }, [leaving]);
  return (
    <>
      {leaving !== null && (
        <span key={`out-${leaving}`} className="np-out">
          {leaving}
        </span>
      )}
      <span key={shown} className={changed ? "np-in" : undefined}>
        {shown}
      </span>
    </>
  );
}

export interface NumberedPaginationProps {
  /** Tên của vùng điều hướng, riêng cho từng danh sách (ví dụ "Phân trang nhật ký"). */
  label: string;
  pageIndex: number;
  totalPages: number;
  /** Đang tải trang mới: khóa các nút để không bấm chồng. */
  busy?: boolean;
  onPage: (page: number) => void;
}

/**
 * Thanh phân trang số có viên thuốc trượt theo trang hiện tại và ô số cuộn khi cửa sổ trang dịch chuyển. Chỉ hiện khi có
 * nhiều hơn một trang. Nút Trang trước, Trang sau mờ ở hai đầu.
 */
export function NumberedPagination({
  label,
  pageIndex,
  totalPages,
  busy = false,
  onPage,
}: NumberedPaginationProps) {
  const [previous, setPrevious] = useState(pageIndex);
  const [back, setBack] = useState(false);
  if (pageIndex !== previous) {
    setBack(pageIndex < previous);
    setPrevious(pageIndex);
  }
  if (totalPages <= 1) {
    return null;
  }
  const slots = pageWindow(pageIndex, totalPages);
  const at = slots.indexOf(pageIndex);
  return (
    <nav aria-label={label} className={`np-nav${back ? " is-back" : ""}`}>
      <button
        type="button"
        className="np-ar"
        aria-label="Trang trước"
        disabled={pageIndex <= 1 || busy}
        onClick={() => onPage(pageIndex - 1)}
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <div className="np-sl" style={{ gridTemplateColumns: `repeat(${slots.length}, 36px)` }}>
        <span
          aria-hidden="true"
          className="np-pill"
          style={{ transform: `translateX(${Math.max(0, at) * SLOT_STEP}px)` }}
        >
          <span key={pageIndex} className="np-pill-in" />
        </span>
        {slots.map((value, index) => {
          if (value === null) {
            return (
              <span key={`dots-${index}`} aria-hidden="true" className="np-n is-dots">
                <RollingText text="…" />
              </span>
            );
          }
          return (
            <button
              key={`slot-${index}`}
              type="button"
              className="np-n"
              aria-label={`Trang ${value}`}
              aria-current={value === pageIndex ? "page" : undefined}
              disabled={busy}
              onClick={() => onPage(value)}
            >
              <RollingText text={String(value)} />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="np-ar"
        aria-label="Trang sau"
        disabled={pageIndex >= totalPages || busy}
        onClick={() => onPage(pageIndex + 1)}
      >
        <ChevronRight aria-hidden="true" />
      </button>
      <p className="sr-only" role="status">
        Trang {pageIndex} trên {totalPages}
      </p>
    </nav>
  );
}
