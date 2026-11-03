import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "cn";
import type { IconComponent } from "./iconType";

export interface PageHeaderProps {
  /** Tiêu đề trang: mỗi trang đúng một `h1`. */
  title: ReactNode;
  description?: ReactNode;
  icon?: IconComponent;
  /** Có thì hiện nút quay lại đứng trước tiêu đề. */
  backHref?: string;
  backLabel?: string;
  /** Nhãn nhỏ phía trên tiêu đề, dùng khi tiêu đề là dữ liệu riêng (ví dụ tên kho). */
  eyebrow?: string;
  /** Nút chính của trang. */
  actions?: ReactNode;
  /** Đường dẫn trang, đặt phía trên tiêu đề. */
  breadcrumb?: ReactNode;
  className?: string;
}

/** Đầu trang dùng chung cho mọi khung theo vai: nút quay lại, ô icon, tiêu đề, một câu giải thích, nút chính. */
export function PageHeader({
  title,
  description,
  icon: Icon,
  backHref,
  backLabel = "Quay lại",
  eyebrow,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {backHref && (
          <Link
            to={backHref}
            aria-label={backLabel}
            title={backLabel}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-heritage-border bg-heritage-surface text-heritage-primary hover:bg-heritage-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        )}
        {Icon && (
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-heritage-primary-light text-heritage-primary"
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          {breadcrumb}
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wider text-heritage-muted">
              {eyebrow}
            </p>
          )}
          <h1 className="break-words text-2xl font-medium tracking-tight text-heritage-primary sm:text-3xl">
            {title}
          </h1>
          {description && <p className="mt-1 text-sm text-heritage-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
