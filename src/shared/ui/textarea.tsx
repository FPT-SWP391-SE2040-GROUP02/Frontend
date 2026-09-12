// ==============================================================================
// SWP391 - LegacyVault: Shared UI Textarea Component
// Component nhập văn bản nhiều dòng tuân thủ Shadcn UI & WCAG 2.1 AA
// ==============================================================================

import { cn } from "cn";
import * as React from "react";

/**
 * @description Component Textarea nhập liệu văn bản nhiều dòng với giao diện đồng nhất hệ thống.
 * @param {React.ComponentProps<"textarea">} props Thuộc tính HTML chuẩn của thẻ textarea
 * @returns {React.JSX.Element} Textarea JSX component
 * @example
 * ```tsx
 * <Textarea placeholder="Nhập ghi chú..." rows={4} />
 * ```
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
