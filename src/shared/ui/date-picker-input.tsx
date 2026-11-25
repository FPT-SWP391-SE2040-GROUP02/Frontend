import { useRef } from "react";
import { Calendar } from "lucide-react";
import { cn } from "cn";
import { DateInput, type DateInputProps } from "./date-input";

/**
 * Ô ngày gõ theo ngày/tháng/năm kèm nút mở lịch của trình duyệt. Chữ trong ô luôn là dd/mm/yyyy; ô type="date" ẩn
 * chỉ dùng để mở bảng lịch. Giá trị ra ngoài là yyyy-mm-dd như DateInput.
 */
export function DatePickerInput({
  max,
  className,
  disabled,
  ...props
}: Omit<DateInputProps, "max"> & { max?: string }) {
  const calendar = useRef<HTMLInputElement>(null);

  function openCalendar(): void {
    const native = calendar.current;
    if (native === null) {
      return;
    }
    if (typeof native.showPicker === "function") {
      try {
        native.showPicker();
        return;
      } catch {
        // Trình duyệt không cho mở bằng lệnh: rơi xuống cách bấm vào ô.
      }
    }
    native.focus();
    native.click();
  }

  return (
    <div className="relative">
      <DateInput {...props} disabled={disabled} className={cn("pr-20", className)} />
      <button
        type="button"
        aria-label="Mở lịch chọn ngày"
        disabled={disabled}
        onClick={openCalendar}
        className="absolute top-0 right-0 flex size-11 items-center justify-center rounded-lg text-heritage-muted hover:text-heritage-primary disabled:opacity-50"
      >
        <Calendar className="size-4" aria-hidden="true" />
      </button>
      <input
        ref={calendar}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        max={max}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className="pointer-events-none absolute right-0 bottom-0 size-px opacity-0"
      />
    </div>
  );
}
