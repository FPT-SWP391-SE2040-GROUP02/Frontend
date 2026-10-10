import { cn } from "cn";
import type { ComponentProps } from "react";

/**
 * @description Ô nhập nhiều dòng dùng chung, hỗ trợ props và ref của textarea.
 * @param props Thuộc tính textarea native và className bổ sung.
 * @returns Ô nhập nhiều dòng theo giao diện Heritage.
 */
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-28 w-full resize-y rounded-xl border border-heritage-border bg-heritage-surface px-3 py-2 text-sm text-heritage-text",
        "placeholder:text-heritage-muted",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-primary",
        "aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
