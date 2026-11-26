import { useEffect, useState, type ReactNode } from "react";

/** Khớp thời gian của `.receive-collapse-slow` trong index.css. */
const SLIDE_MS = 350;

/**
 * Khối trượt mở và đóng cho nội dung hiện/ẩn bằng điều kiện. Nội dung chỉ nằm trong cây khi đang mở hoặc đang trượt
 * đóng (hết hiệu ứng thì gỡ như trước, nên trạng thái bên trong vẫn được đặt lại). Khi đóng, khối không nhận tab hay
 * chuột (`inert`). Dùng `.receive-collapse` ở index.css; chế độ giảm chuyển động tắt hiệu ứng ở đó.
 */
export function Collapse({
  open,
  children,
  id,
  className = "",
}: {
  open: boolean;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(open);
  if (open && !mounted) {
    setMounted(true);
  }
  useEffect(() => {
    if (open) {
      // Dựng ở độ cao 0 rồi mở ra ở khung hình kế tiếp để có hiệu ứng.
      const frame = window.requestAnimationFrame(() => setEntered(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const timer = window.setTimeout(() => {
      setEntered(false);
      setMounted(false);
    }, SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [open]);
  if (!mounted) {
    return null;
  }
  const visible = open && entered;
  return (
    <div
      id={id}
      data-open={visible}
      inert={!visible}
      className={`receive-collapse receive-collapse-slow ${className}`}
    >
      <div>{children}</div>
    </div>
  );
}
