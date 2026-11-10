import type { ReactNode } from "react";

/**
 * Khung trượt ra trượt vào: nội dung dài (điều khoản, toàn văn biên bản) thu gọn mặc định cho gọn mắt, mở ra bằng nút.
 * Nội dung luôn nằm trong trang nhưng bị ẩn với trình đọc và bàn phím khi đóng; chuyển động tắt khi người dùng chọn giảm chuyển động.
 */
export function SlidePanel({
  id,
  open,
  children,
}: {
  id: string;
  open: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      aria-hidden={!open}
      className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="min-h-0 overflow-hidden" inert={!open}>
        {children}
      </div>
    </div>
  );
}

/** Nút mở hoặc thu gọn đi kèm SlidePanel; mũi tên xoay theo trạng thái. */
export function SlideToggle({
  controls,
  open,
  onToggle,
  children,
  className = "",
}: {
  controls: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-heritage-primary focus-visible:outline-2 focus-visible:outline-heritage-gold ${className}`}
    >
      {children}
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className={`size-3.5 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
      >
        <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </button>
  );
}
