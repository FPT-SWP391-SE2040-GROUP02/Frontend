import type { ComponentProps } from "react";
import { cn } from "cn";

export interface SwitchProps extends Omit<ComponentProps<"button">, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * Switch component tuân thủ WAI-ARIA switch pattern.
 * Dùng cho các cờ bật/tắt tính năng, mở bán gói, kích hoạt cấu hình hệ thống.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        // min-h-0: CSS gốc đặt mọi nút cao tối thiểu 44px làm công tắc méo thành hình tròn to.
        // after: vùng bấm trong suốt cao hơn công tắc, giữ đủ 44px cho người lớn tuổi.
        "relative inline-flex h-6 min-h-0 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out after:absolute after:inset-x-0 after:-inset-y-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-heritage-gold-soft focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "bg-heritage-success dark:bg-heritage-success"
          : "bg-heritage-border-strong dark:bg-heritage-muted",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
