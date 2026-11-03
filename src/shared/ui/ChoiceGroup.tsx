import { useRef, type KeyboardEvent } from "react";
import { cn } from "cn";
import type { IconComponent } from "./iconType";

export interface ChoiceOption<Value extends string> {
  value: Value;
  label: string;
  description?: string;
  icon?: IconComponent;
  disabled?: boolean;
}

export interface ChoiceGroupProps<Value extends string> {
  options: ChoiceOption<Value>[];
  /** null nghĩa là chưa chọn. */
  value: Value | null;
  onChange: (value: Value) => void;
  /** `cards`: thẻ lớn có mô tả; `segmented`: hàng nút phân đoạn, cuộn ngang ở màn hẹp. */
  variant?: "cards" | "segmented";
  /** Số cột của kiểu `cards` từ màn trung bình trở lên. */
  columns?: 2 | 3 | 4;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  disabled?: boolean;
  className?: string;
}

const COLUMNS: Record<2 | 3 | 4, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * Nhóm lựa chọn một trong nhiều, đọc như `radiogroup`: phím mũi tên đổi lựa chọn, Tab ra khỏi nhóm.
 * Dùng thay cho ô chọn thả xuống khi có ít lựa chọn và người dùng cần thấy hết.
 */
export function ChoiceGroup<Value extends string>({
  options,
  value,
  onChange,
  variant = "cards",
  columns = 3,
  ariaLabel,
  ariaLabelledBy,
  disabled = false,
  className,
}: ChoiceGroupProps<Value>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = options.filter((option) => !option.disabled);
  const focusable =
    value !== null && enabled.some((option) => option.value === value) ? value : enabled[0]?.value;

  function move(from: number, step: 1 | -1): void {
    for (let offset = 1; offset <= options.length; offset++) {
      const next = (from + step * offset + options.length * offset) % options.length;
      const option = options[next];
      if (option && !option.disabled) {
        onChange(option.value);
        refs.current[next]?.focus();
        return;
      }
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      move(index, 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      move(index, -1);
    }
  }

  const segmented = variant === "segmented";
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-disabled={disabled || undefined}
      className={cn(
        segmented
          ? "inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-heritage-border bg-heritage-surface p-1"
          : cn("grid gap-3", COLUMNS[columns]),
        className,
      )}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        const Icon = option.icon;
        const off = disabled || option.disabled;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={off}
            tabIndex={option.value === focusable ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "min-h-11 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold disabled:pointer-events-none disabled:opacity-50",
              segmented
                ? "shrink-0 whitespace-nowrap rounded-lg px-4 text-sm font-semibold"
                : "flex flex-col items-start gap-2 rounded-2xl border bg-heritage-surface p-5",
              segmented &&
                (checked
                  ? "bg-heritage-primary text-white"
                  : "text-heritage-muted hover:bg-heritage-neutral-bg"),
              !segmented &&
                (checked
                  ? "border-heritage-gold ring-2 ring-heritage-gold"
                  : "border-heritage-border hover:border-heritage-gold-border"),
            )}
          >
            {Icon && !segmented && (
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-xl bg-heritage-primary-light text-heritage-primary"
              >
                <Icon className="size-5" aria-hidden="true" />
              </span>
            )}
            <span className={cn(!segmented && "text-base font-semibold text-heritage-primary")}>
              {option.label}
            </span>
            {option.description && !segmented && (
              <span className="text-sm text-heritage-muted">{option.description}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
