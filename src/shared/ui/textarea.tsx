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
        "min-h-28 w-full min-w-0 max-w-full resize-y rounded-xl border border-heritage-border-strong bg-heritage-surface px-3.5 py-2.5 text-sm text-heritage-text",
        "placeholder:text-heritage-subtle",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold-hover",
        "aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
