import { Link } from "react-router-dom";

/** Thuộc tính dải thông báo bảo trì ở đầu trang. */
export interface MaintenanceNoticeBarProps {
  message: string;
  actionLabel: string;
  actionHref: string;
}

/**
 * Dải thông báo mảnh ở đầu trang trong lúc bảo trì: nhắc Quản trị viên rằng chế độ đang bật,
 * hoặc giải thích trên trang đăng nhập quản trị rằng chỉ Admin vào được.
 * Cùng bảng màu cố định với màn hình bảo trì; dấu hiệu là một chấm vàng thay cho icon.
 */
export function MaintenanceNoticeBar({
  message,
  actionLabel,
  actionHref,
}: MaintenanceNoticeBarProps) {
  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-[#12392C] px-4 py-2.5 text-center text-[13px] text-[#EFECE3]"
    >
      <span className="inline-flex items-center gap-2.5">
        <span className="size-2 flex-none rounded-full bg-[#E0C486]" aria-hidden="true" />
        {message}
      </span>
      <Link
        to={actionHref}
        className="font-semibold text-[#E0C486] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0C486]"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
