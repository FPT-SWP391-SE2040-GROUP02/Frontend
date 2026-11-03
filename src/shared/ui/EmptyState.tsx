import type { ReactNode } from "react";
import { cn } from "cn";
import type { IconComponent } from "./iconType";

export interface EmptyStateProps {
  icon?: IconComponent;
  title: string;
  description?: string;
  /** Việc nên làm tiếp, thường là một nút hoặc liên kết. */
  action?: ReactNode;
  className?: string;
}

/** Chỗ trống có lý do và có đường đi tiếp, thay cho những câu "Chưa có…" rời rạc. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-heritage-border px-6 py-10 text-center",
        className,
      )}
    >
      {Icon && (
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-heritage-primary-light text-heritage-primary"
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <p className="text-base font-semibold text-heritage-primary">{title}</p>
      {description && <p className="max-w-md text-sm text-heritage-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
