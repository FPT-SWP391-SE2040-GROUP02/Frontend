import { type ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Button } from "./button";

/**
 * @description Thuộc tính cấu hình cho component EmptyState.
 */
export interface EmptyStateProps {
  /** Icon minh họa (mặc định là biểu tượng Inbox) */
  icon?: ReactNode;
  /** Tiêu đề thông báo trạng thái rỗng */
  title?: string;
  /** Mô tả chi tiết hoặc gợi ý hành động */
  description?: string;
  /** Nhãn của nút hành động (nếu có) */
  actionLabel?: string;
  /** Callback được gọi khi người dùng nhấn nút hành động */
  onAction?: () => void;
  /** Thành phần tùy chỉnh bổ sung bên dưới */
  children?: ReactNode;
}

/**
 * @description Component hiển thị trạng thái dữ liệu rỗng (Empty State) theo chuẩn UI/UX Pro Max.
 * Tránh để màn hình trắng trơn khi bảng hoặc danh sách chưa có dữ liệu.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="Chưa có đơn hàng nào"
 *   description="Các đơn hàng mới sẽ hiển thị tại đây khi khách hàng đặt mua."
 *   actionLabel="Tạo đơn hàng mới"
 *   onAction={() => handleCreate()}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title = "Chưa có dữ liệu",
  description = "Hiện tại không tìm thấy dữ liệu phù hợp trong hệ thống.",
  actionLabel,
  onAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center animate-in fade-in-50">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4 shadow-xs">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
