import React, { useState } from "react";
import { Scale } from "lucide-react";
import { CustomCheckbox } from "./CustomCheckbox";

/**
 * @description Thuộc tính cấu hình cho ComplianceCallout component.
 */
export interface ComplianceCalloutProps {
  /** Tiêu đề điều luật */
  title?: string;
  /** Nội dung giải thích pháp lý */
  description?: string;
  /** Nội dung cam đoan */
  disclaimerText?: string;
  /** Callback khi người dùng tick cam đoan */
  onAgreedChange?: (agreed: boolean) => void;
  /** Class CSS tùy chỉnh */
  className?: string;
}

/**
 * @description Hộp cảnh báo tuân thủ pháp luật (Điều 644 / Điều 612 BLDS 2015) chuẩn Master UI Kit với màu hổ phách vàng và checkbox cam đoan.
 *
 * @param {ComplianceCalloutProps} props Thuộc tính component
 * @returns {React.JSX.Element} Hộp cảnh báo pháp lý
 *
 * @example
 * ```tsx
 * <ComplianceCallout onAgreedChange={agreed => console.log(agreed)} />
 * ```
 */
export function ComplianceCallout({
  title = "⚖️ Cảnh báo pháp lý: Thừa kế không phụ thuộc nội dung di chúc (Điều 644 BLDS 2015)",
  description = "Kế hoạch phân bổ của bạn chưa chỉ định con chưa thành niên hoặc cha mẹ già. Họ có quyền hưởng ít nhất 2/3 một suất thừa kế theo luật định dù di chúc không chia tài sản.",
  disclaimerText = "Tôi cam đoan tự chịu trách nhiệm về các phát sinh tranh chấp dân sự đối với phần tài sản này",
  onAgreedChange,
  className = "",
}: ComplianceCalloutProps) {
  const [agreed, setAgreed] = useState<boolean>(false);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setAgreed(val);
    onAgreedChange?.(val);
  };

  return (
    <div className={`compliance-callout ${className}`}>
      <div className="text-[12px] font-bold text-[#92400E] flex items-center gap-1.5 mb-1">
        <Scale className="w-4 h-4 text-[#D97706] shrink-0" />
        <span>{title}</span>
      </div>

      <p className="text-[11px] text-[#78350F] leading-relaxed mb-2.5">
        {description}
      </p>

      <CustomCheckbox
        label={<span className="text-[#92400E] text-[11px] font-semibold">{disclaimerText}</span>}
        checked={agreed}
        onChange={handleToggle}
      />
    </div>
  );
}
