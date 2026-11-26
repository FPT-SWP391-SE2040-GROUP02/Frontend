// Lucian UX/UI Prompt #040 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#040
import type { CSSProperties, ReactNode } from "react";
import { cn } from "cn";

/**
 * Chữ trong cột menu: mờ đi khi menu thu gọn, hiện lần lượt từng dòng theo `order` khi mở. Chữ vẫn nằm trong trang nên
 * trình đọc màn hình và tên liên kết không đổi.
 */
export function RailLabel({
  order = 0,
  className,
  children,
}: {
  order?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("u040-label", className)} style={{ "--i": order } as CSSProperties}>
      {children}
    </span>
  );
}
