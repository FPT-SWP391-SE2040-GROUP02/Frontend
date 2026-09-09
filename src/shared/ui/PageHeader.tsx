import { type ReactNode } from "react";

/**
 * @description Thuộc tính cấu hình cho component PageHeader.
 */
export interface PageHeaderProps {
  /** Tiêu đề chính của trang */
  title: string;
  /** Mô tả ngắn gọn về chức năng của trang */
  description?: string;
  /** Badge hoặc tag đính kèm cạnh tiêu đề */
  badge?: ReactNode;
  /** Khu vực hiển thị nút hành động (Buttons, Search input...) ở góc phải */
  actions?: ReactNode;
}

/**
 * @description Component tiêu đề chuẩn mực cho mỗi trang trong ứng dụng.
 * Tạo sự đồng bộ và thẩm mỹ cho giao diện theo chuẩn UI/UX Pro Max.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Quản Lý Người Dùng"
 *   description="Xem danh sách, phân quyền và kích hoạt tài khoản thành viên."
 *   badge={<Badge variant="secondary">150 thành viên</Badge>}
 *   actions={<Button>+ Thêm mới</Button>}
 * />
 * ```
 */
export function PageHeader({ title, description, badge, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-6 pt-2 md:flex-row md:items-center md:justify-between border-b border-border/40">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
