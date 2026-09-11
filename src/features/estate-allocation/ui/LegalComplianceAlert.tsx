import * as React from "react";

/**
 * Thuộc tính của component LegalComplianceAlert
 */
export interface LegalComplianceAlertProps {
  /**
   * Trạng thái đã tích cam kết chấp thuận rủi ro hay chưa
   */
  isAcknowledged?: boolean;
  /**
   * Callback khi người dùng tick vào ô cam kết tự chịu trách nhiệm
   */
  onAcknowledgeChange?: (acknowledged: boolean) => void;
  /**
   * Mã điều luật hiển thị (mặc định: "Điều 644 BLDS 2015")
   */
  articleReference?: string;
  /**
   * Tiêu đề cảnh báo
   */
  title?: string;
  /**
   * Nội dung chi tiết quy định pháp lý
   */
  description?: string;
  /**
   * Class CSS bổ sung
   */
  className?: string;
}

/**
 * @description Hộp cảnh báo tuân thủ pháp luật (Legal Compliance Callout).
 * Cảnh báo rủi ro di chúc không chia tài sản cho diện thừa kế bắt buộc theo Điều 644 Bộ luật Dân sự 2015
 * (con chưa thành niên, cha mẹ, vợ/chồng) hoặc tài sản chung vợ chồng Điều 612.
 * Tích hợp ô Checkbox tùy biến đã fix lỗi hiển thị, bảo đảm trải nghiệm UX mượt mà.
 *
 * @param {LegalComplianceAlertProps} props Thuộc tính component
 * @returns {React.ReactElement} Phần tử giao diện LegalComplianceAlert
 *
 * @example
 * ```tsx
 * <LegalComplianceAlert
 *   isAcknowledged={hasAgreedToArticle644}
 *   onAcknowledgeChange={(agreed) => setHasAgreedToArticle644(agreed)}
 * />
 * ```
 */
export const LegalComplianceAlert: React.FC<LegalComplianceAlertProps> = ({
  isAcknowledged = false,
  onAcknowledgeChange,
  articleReference = "Điều 644 Bộ luật Dân sự 2015",
  title = "Cảnh báo pháp lý: Thừa kế không phụ thuộc vào nội dung di chúc",
  description = "Kế hoạch phân bổ của bạn chưa chỉ định con chưa thành niên, cha mẹ già hoặc vợ/chồng. Theo luật định, những người này vẫn được hưởng ít nhất 2/3 một suất thừa kế theo pháp luật, dù di chúc không để lại tài sản cho họ.",
  className = "",
}) => {
  const [internalChecked, setInternalChecked] = React.useState<boolean>(isAcknowledged);
  const inputId = React.useId();

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setInternalChecked(checked);
    if (onAcknowledgeChange) {
      onAcknowledgeChange(checked);
    }
  };

  return (
    <div
      className={`bg-[#fffbeb] border border-[#fde68a] border-l-4 border-l-amber-600 rounded-xl p-4 sm:p-5 shadow-xs ${className}`}
    >
      <div className="flex items-start gap-2.5 mb-1.5">
        <span className="text-base shrink-0 mt-0.5">⚖️</span>
        <div>
          <div className="text-xs sm:text-[13px] font-bold text-amber-900">
            {title} ({articleReference})
          </div>
          <div className="text-xs text-amber-950/80 leading-relaxed mt-1">{description}</div>
        </div>
      </div>

      {/* Checkbox đã sửa dứt điểm lỗi */}
      <div className="mt-3 pt-2.5 border-t border-amber-200/60">
        <label
          htmlFor={inputId}
          className="inline-flex items-start gap-2.5 cursor-pointer select-none text-xs text-amber-900 font-medium"
        >
          <input
            id={inputId}
            type="checkbox"
            checked={internalChecked}
            onChange={handleCheckboxChange}
            className="appearance-none w-4 h-4 rounded border-[1.5px] border-[#a8a295] bg-white grid place-content-center cursor-pointer transition-all duration-150 m-0 shrink-0 mt-0.5 checked:bg-[var(--heritage-primary,#0b291e)] checked:border-[var(--heritage-primary,#0b291e)] before:content-[''] before:w-2 before:h-2 before:scale-0 checked:before:scale-100 before:shadow-[inset_1em_1em_#ffffff] before:transition-transform before:duration-100 before:[clip-path:polygon(14%_44%,0_65%,50%_100%,100%_16%,80%_0%,43%_62%)]"
          />
          <span className="leading-snug">
            Tôi đã đọc, hiểu rõ quy định tại {articleReference} và tự chịu hoàn toàn trách nhiệm pháp
            lý nếu có phát sinh tranh chấp dân sự từ những người thừa kế bắt buộc.
          </span>
        </label>
      </div>
    </div>
  );
};
