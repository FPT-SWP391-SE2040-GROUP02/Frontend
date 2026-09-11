import * as React from "react";

/**
 * Thuộc tính của component Slider
 */
export interface SliderProps {
  /**
   * Giá trị hiện tại của slider
   */
  value?: number;
  /**
   * Giá trị mặc định
   */
  defaultValue?: number;
  /**
   * Giá trị tối thiểu (mặc định: 0)
   */
  min?: number;
  /**
   * Giá trị tối đa (mặc định: 100)
   */
  max?: number;
  /**
   * Bước nhảy giá trị (mặc định: 1)
   */
  step?: number;
  /**
   * Callback khi giá trị thay đổi
   */
  onValueChange?: (value: number) => void;
  /**
   * Nhãn văn bản
   */
  label?: string;
  /**
   * Đơn vị hiển thị bên cạnh giá trị (ví dụ: "%", "ngày")
   */
  unit?: string;
  /**
   * Vô hiệu hóa tương tác
   */
  disabled?: boolean;
  /**
   * Class CSS bổ sung
   */
  className?: string;
}

/**
 * @description Component Slider tùy biến cho phép chọn tỷ lệ phần trăm phân bổ tài sản hoặc số ngày DMS.
 * Tích hợp tooltip hiển thị giá trị thời gian thực theo phong cách Heritage Forest Green.
 *
 * @param {SliderProps} props Thuộc tính cấu hình slider
 * @returns {React.ReactElement} Phần tử giao diện Slider
 *
 * @example
 * ```tsx
 * <Slider
 *   label="Tỷ lệ phân bổ cho người thụ hưởng"
 *   value={allocationPercent}
 *   onValueChange={(val) => setAllocationPercent(val)}
 *   unit="%"
 * />
 * ```
 */
export const Slider: React.FC<SliderProps> = ({
  value,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  label,
  unit = "%",
  disabled = false,
  className = "",
}) => {
  const [internalValue, setInternalValue] = React.useState<number>(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numVal = Number(e.target.value);
    if (!isControlled) {
      setInternalValue(numVal);
    }

    // TODO: 1. Kiểm tra giới hạn tổng tỷ lệ phân bổ (Tổng các heirs không vượt quá 100%)
    // TODO: 2. Validate điều kiện biên (min, max, step hợp lệ)
    // TODO: 3. Kích hoạt onValueChange callback thông báo cho form cha
    if (onValueChange) {
      onValueChange(numVal);
    }
  };

  return (
    <div className={`flex flex-col gap-2 w-full max-w-[280px] ${className}`}>
      {label && (
        <div className="flex justify-between items-center text-xs font-semibold text-[var(--heritage-primary,#0b291e)]">
          <span>{label}</span>
          <span className="font-mono text-[var(--heritage-gold,#b88e4c)] font-bold">
            {currentValue}
            {unit}
          </span>
        </div>
      )}
      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          disabled={disabled}
          onChange={handleChange}
          className="w-full h-1.5 bg-[#d2cdc1] rounded-lg appearance-none cursor-pointer accent-[var(--heritage-primary,#0b291e)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex justify-between text-[9.5px] text-[var(--text-muted,#66786e)] font-mono">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {Math.round((max - min) / 2)}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
};
