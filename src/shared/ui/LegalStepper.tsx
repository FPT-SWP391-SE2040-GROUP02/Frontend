import * as React from "react";

/**
 * Cấu trúc một bước trong quy trình pháp lý
 */
export interface StepItem {
  /**
   * Thứ tự bước (1-indexed)
   */
  step: number;
  /**
   * Tiêu đề bước
   */
  title: string;
  /**
   * Mô tả phụ ngắn gọn
   */
  description?: string;
}

/**
 * Thuộc tính của component LegalStepper
 */
export interface LegalStepperProps {
  /**
   * Bước hiện tại đang được kích hoạt (bắt đầu từ 1)
   */
  currentStep: number;
  /**
   * Danh sách các bước trong quy trình
   */
  steps?: StepItem[];
  /**
   * Callback khi người dùng nhấp vào bước đã hoàn thành để quay lại
   */
  onStepClick?: (stepNumber: number) => void;
  /**
   * Class CSS bổ sung
   */
  className?: string;
}

const DEFAULT_STEPS: StepItem[] = [
  { step: 1, title: "Asset Vault", description: "Định danh tài sản" },
  { step: 2, title: "Heirs & Rules", description: "Người nhận & Tỷ lệ" },
  { step: 3, title: "Notary Review", description: "Đối soát công chứng" },
  { step: 4, title: "Smart Seal", description: "Niêm phong số" },
];

/**
 * @description Component quy trình pháp lý 4 bước (Legal Stepper) theo chuẩn FSD.
 * Hiển thị tiến trình ký kết di chúc số từ khai báo tài sản đến niêm phong mật mã.
 *
 * @param {LegalStepperProps} props Thuộc tính của LegalStepper
 * @returns {React.ReactElement} Phần tử giao diện Stepper
 *
 * @example
 * ```tsx
 * <LegalStepper
 *   currentStep={2}
 *   onStepClick={(step) => navigateToStep(step)}
 * />
 * ```
 */
export const LegalStepper: React.FC<LegalStepperProps> = ({
  currentStep = 1,
  steps = DEFAULT_STEPS,
  onStepClick,
  className = "",
}) => {
  const handleStepClick = (stepNumber: number) => {
    // TODO: 1. Kiểm tra điều kiện người dùng chỉ được click quay lại các bước đã hoàn thành (< currentStep)
    // TODO: 2. Không cho phép nhảy cóc tới các bước tương lai chưa hoàn tất xác thực
    // TODO: 3. Kích hoạt callback onStepClick
    if (stepNumber < currentStep && onStepClick) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div
      className={`flex items-center justify-between w-full bg-[var(--heritage-surface,#faf9f5)] dark:bg-[#0a1d15] p-4 sm:p-5 rounded-xl border border-[#ddd8cb] dark:border-[#1d3b2f] ${className}`}
    >
      {steps.map((item, index) => {
        const isCompleted = item.step < currentStep;
        const isActive = item.step === currentStep;

        return (
          <React.Fragment key={item.step}>
            <div
              className={`flex flex-col items-center gap-1.5 relative cursor-pointer ${
                isCompleted || isActive ? "opacity-100" : "opacity-60"
              }`}
              onClick={() => handleStepClick(item.step)}
            >
              {isActive && (
                <div className="absolute -top-7 whitespace-nowrap bg-[var(--heritage-primary,#0b291e)] dark:bg-[var(--heritage-gold,#d4af37)] text-white dark:text-[#06120d] text-[9.5px] px-2 py-0.5 rounded shadow-sm font-semibold">
                  Bước hiện tại: {item.title}
                </div>
              )}

              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 border ${
                  isCompleted
                    ? "bg-[var(--heritage-primary,#0b291e)] dark:bg-[#164d3b] border-[var(--heritage-primary,#0b291e)] text-white"
                    : isActive
                    ? "bg-white dark:bg-[#0a1d15] border-[var(--heritage-primary,#0b291e)] dark:border-[var(--heritage-gold,#d4af37)] text-[var(--heritage-primary,#0b291e)] dark:text-[var(--heritage-gold,#d4af37)] ring-2 ring-[var(--heritage-primary,#0b291e)]/20"
                    : "bg-white dark:bg-[#0e241b] border-[#b8b2a4] dark:border-[#2d4d3d] text-[var(--text-muted,#66786e)]"
                }`}
              >
                {isCompleted ? "✓" : item.step}
              </div>

              <span
                className={`text-[11px] text-center font-medium ${
                  isActive
                    ? "text-[var(--heritage-primary,#0b291e)] dark:text-[var(--heritage-gold,#d4af37)] font-bold"
                    : "text-[var(--text-muted,#66786e)]"
                }`}
              >
                {item.title}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-[1.5px] mx-2 transition-colors duration-200 ${
                  item.step < currentStep
                    ? "bg-[var(--heritage-primary,#0b291e)] dark:bg-[#164d3b]"
                    : "bg-[#dcd7cb] dark:bg-[#1d3b2f]"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
