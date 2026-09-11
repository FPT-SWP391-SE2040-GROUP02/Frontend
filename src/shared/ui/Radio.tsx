import * as React from "react";

/**
 * Thuộc tính của component Radio
 */
export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Nhãn văn bản hiển thị cạnh nút radio
   */
  label?: string;
  /**
   * Thông báo lỗi nếu có
   */
  errorMessage?: string;
}

/**
 * @description Component Radio Button được tùy biến giao diện theo chuẩn Heritage Forest Green.
 * Hỗ trợ các trạng thái checked, disabled và error.
 *
 * @param {RadioProps} props Thuộc tính component gồm label, name, value, checked, onChange...
 * @returns {React.ReactElement} Phần tử giao diện Radio button
 *
 * @example
 * ```tsx
 * <Radio
 *   name="planType"
 *   value="irrevocable"
 *   label="Di chúc bất khả hủy ngang"
 *   checked={selectedPlan === "irrevocable"}
 *   onChange={(e) => setSelectedPlan(e.target.value)}
 * />
 * ```
 */
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className = "", label, errorMessage, id, disabled, onChange, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // TODO: 1. Kiểm tra điều kiện disabled trước khi xử lý
      // TODO: 2. Kích hoạt callback onChange truyền từ props ngoài
      // TODO: 3. Dispatch analytics tracking nếu đây là lựa chọn quan trọng
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="inline-flex flex-col gap-1">
        <label
          htmlFor={inputId}
          className={`inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-[var(--text-main,#14241c)] ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } ${className}`}
        >
          <input
            ref={ref}
            type="radio"
            id={inputId}
            disabled={disabled}
            onChange={handleChange}
            className="appearance-none w-[17px] h-[17px] rounded-full border-[1.5px] border-[#a8a295] bg-white grid place-content-center cursor-pointer transition-all duration-150 m-0 shrink-0 checked:border-[var(--heritage-primary,#0b291e)] before:content-[''] before:w-[7px] before:h-[7px] before:rounded-full before:scale-0 checked:before:scale-100 before:bg-[var(--heritage-primary,#0b291e)] before:transition-transform before:duration-100 disabled:cursor-not-allowed"
            {...props}
          />
          {label && <span>{label}</span>}
        </label>
        {errorMessage && (
          <span className="text-[10.5px] text-red-600 font-normal">{errorMessage}</span>
        )}
      </div>
    );
  }
);

Radio.displayName = "Radio";
