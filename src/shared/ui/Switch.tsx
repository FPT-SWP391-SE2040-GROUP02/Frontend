import * as React from "react";

/**
 * Thuộc tính của component Switch
 */
export interface SwitchProps {
  /**
   * Trạng thái bật/tắt của switch
   */
  checked?: boolean;
  /**
   * Trạng thái mặc định nếu không điều khiển (uncontrolled)
   */
  defaultChecked?: boolean;
  /**
   * Callback khi thay đổi trạng thái
   */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Vô hiệu hóa tương tác
   */
  disabled?: boolean;
  /**
   * Nhãn mô tả đi kèm switch
   */
  label?: string;
  /**
   * Class CSS bổ sung
   */
  className?: string;
  /**
   * Định danh duy nhất
   */
  id?: string;
}

/**
 * @description Component Toggle Switch tùy biến theo phong cách Heritage Forest Green & Tactile Depth.
 * Dùng để bật/tắt các cấu hình pháp lý hoặc bảo mật như Dead-Man's Switch, Yêu cầu E-KYC.
 *
 * @param {SwitchProps} props Thuộc tính của switch
 * @returns {React.ReactElement} Phần tử giao diện Switch
 *
 * @example
 * ```tsx
 * <Switch
 *   checked={isDmsEnabled}
 *   onCheckedChange={(checked) => setIsDmsEnabled(checked)}
 *   label="Kích hoạt Dead Man's Switch (45 ngày)"
 * />
 * ```
 */
export const Switch: React.FC<SwitchProps> = ({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  label,
  className = "",
  id,
}) => {
  const generatedId = React.useId();
  const switchId = id ?? generatedId;
  const [internalChecked, setInternalChecked] = React.useState<boolean>(defaultChecked);

  const isControlled = checked !== undefined;
  const currentChecked = isControlled ? checked : internalChecked;

  const handleToggle = () => {
    if (disabled) return;

    const nextState = !currentChecked;
    if (!isControlled) {
      setInternalChecked(nextState);
    }

    // TODO: 1. Xác thực quyền hạn người dùng trước khi thay đổi trạng thái nhạy cảm (Security Switch)
    // TODO: 2. Gọi API cập nhật cấu hình bảo mật hoặc trigger Redux action
    // TODO: 3. Kích hoạt onCheckedChange callback ra ngoài
    if (onCheckedChange) {
      onCheckedChange(nextState);
    }
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={currentChecked}
        disabled={disabled}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-[2px] transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--heritage-gold,#b88e4c)] ${
          currentChecked ? "bg-[var(--heritage-primary,#0b291e)]" : "bg-[#ccc7ba]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            currentChecked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      {label && (
        <label
          htmlFor={switchId}
          className={`text-xs font-medium text-[var(--text-main,#14241c)] cursor-pointer ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {label}
        </label>
      )}
    </div>
  );
};
