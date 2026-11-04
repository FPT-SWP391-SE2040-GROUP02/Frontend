import { Link } from "react-router-dom";
import { Wrench } from "lucide-react";

/** Thuộc tính dải thông báo bảo trì ở đầu trang. */
export interface MaintenanceNoticeBarProps {
  message: string;
  actionLabel: string;
  actionHref: string;
}

/**
 * Dải thông báo mảnh ở đầu trang trong lúc bảo trì: nhắc Quản trị viên rằng chế độ đang bật,
 * hoặc giải thích trên trang đăng nhập quản trị rằng chỉ Admin vào được.
 */
export function MaintenanceNoticeBar({
  message,
  actionLabel,
  actionHref,
}: MaintenanceNoticeBarProps) {
  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-heritage-gold-border bg-heritage-gold-light px-4 py-2 text-center text-xs font-semibold text-heritage-text"
    >
      <span className="inline-flex items-center gap-2">
        <Wrench className="size-3.5 text-heritage-gold" aria-hidden="true" />
        {message}
      </span>
      <Link
        to={actionHref}
        className="text-heritage-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
