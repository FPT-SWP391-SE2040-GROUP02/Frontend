import * as React from "react";

/**
 * @description Thuộc tính cấu hình cho CustomCheckbox theo chuẩn Master UI Kit LegacyVault.
 */
export interface CustomCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Nhãn hiển thị bên cạnh checkbox */
  label?: React.ReactNode;
  /** Class CSS tùy chỉnh */
  className?: string;
}

/**
 * @description Checkbox tùy biến chuẩn Master UI Kit (vuông 17x17px, viền #A8A295, checked #0B291E với icon check trắng).
 *
 * @param {CustomCheckboxProps} props Thuộc tính checkbox
 * @returns {React.JSX.Element} Checkbox tùy biến
 *
 * @example
 * ```tsx
 * <CustomCheckbox label="Ghi nhớ đăng nhập" checked={remember} onChange={e => setRemember(e.target.checked)} />
 * ```
 */
export const CustomCheckbox = React.forwardRef<HTMLInputElement, CustomCheckboxProps>(
  ({ label, className = "", id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <label htmlFor={inputId} className={`custom-checkbox ${className}`}>
        <input ref={ref} type="checkbox" id={inputId} {...props} />
        {label && <span className="text-[12px] text-[var(--text-main)] select-none pt-0.5">{label}</span>}
      </label>
    );
  }
);

CustomCheckbox.displayName = "CustomCheckbox";
