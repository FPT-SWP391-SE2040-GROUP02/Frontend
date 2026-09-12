import React from "react";
import { 
  Input, 
  Button 
} from "@/shared/ui";
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Users, 
  Scale, 
  CheckCircle,
  ExternalLink 
} from "lucide-react";
import type { BeneficiaryAllocation } from "../model/will.types";

/**
 * @file Step2AllocateBeneficiaries.tsx
 * @description Bước 2 của Digital Will Wizard: Phân bổ tỷ lệ % thừa kế cho người thụ hưởng.
 * Tích hợp Thành phần Master UI Kit #5: Hộp Cảnh Báo Tuân Thủ Pháp Luật (Điều 644 BLDS 2015).
 */

interface Step2AllocateBeneficiariesProps {
  allocations: BeneficiaryAllocation[];
  onAddBeneficiary: () => void;
  onRemoveBeneficiary: (index: number) => void;
  onUpdateBeneficiary: (index: number, field: keyof BeneficiaryAllocation, value: unknown) => void;
  legalComplianceConfirmed: boolean;
  onLegalComplianceChange: (confirmed: boolean) => void;
  errorMessage?: string | null;
}

export const Step2AllocateBeneficiaries: React.FC<Step2AllocateBeneficiariesProps> = ({
  allocations,
  onAddBeneficiary,
  onRemoveBeneficiary,
  onUpdateBeneficiary,
  legalComplianceConfirmed,
  onLegalComplianceChange,
  errorMessage,
}) => {
  const totalPercentage = allocations.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0);
  const isExact100 = Math.abs(totalPercentage - 100) < 0.01;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#14241C]">
          Bước 2: Phân Bổ Tỷ Lệ Thừa Kế & Tuân Thủ Pháp Luật
        </h2>
        <p className="text-xs text-[#66786E] mt-1 leading-relaxed">
          Chỉ định danh sách người thừa kế hợp pháp và tỷ lệ phần trăm phân chia. Tổng tỷ lệ phân bổ của tất cả người thừa kế bắt buộc phải bằng chính xác 100%.
        </p>
      </div>

      {errorMessage && (
        <div 
          role="alert" 
          className="p-3.5 rounded-[14px] bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-2 text-xs text-[#DC2626] font-medium"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* THÀNH PHẦN MASTER UI KIT #5: HỘP CẢNH BÁO TUÂN THỦ PHÁP LUẬT (ĐIỀU 644 BLDS 2015) */}
      <section 
        aria-label="Cảnh báo pháp lý Điều 644 BLDS"
        className="p-5 sm:p-6 rounded-[22px] bg-[#FFFBEB] border border-[#FDE68A] shadow-[0_2px_12px_rgba(180,83,9,0.06)] space-y-4"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-[14px] bg-[#FEF3C7] border border-[#FCD34D] flex items-center justify-center text-[#B45309] shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-[#92400E]">
                Cảnh Báo Pháp Lý: Người Thừa Kế Không Phụ Thuộc Vào Nội Dung Di Chúc
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                Điều 644 BLDS 2015
              </span>
            </div>
            <p className="text-xs text-[#78350F] mt-1.5 leading-relaxed">
              Theo quy định tại <strong>Điều 644 Bộ Luật Dân Sự 2015</strong>, những người sau đây vẫn được hưởng phần di sản bằng <strong>hai phần ba (2/3)</strong> suất của một người thừa kế theo pháp luật nếu di chúc không cho họ hưởng di sản hoặc chỉ cho hưởng phần di sản ít hơn 2/3 suất đó:
            </p>
            <ul className="text-xs text-[#78350F] mt-2 space-y-1 list-disc list-inside font-medium">
              <li>Con chưa thành niên, cha, mẹ, vợ, chồng;</li>
              <li>Con thành niên mà không có khả năng lao động.</li>
            </ul>
          </div>
        </div>

        {/* Checkbox Cam Đoan Pháp Lý (WCAG Touch Target >= 44px) */}
        <label 
          htmlFor="legal-compliance-checkbox"
          className="flex items-center gap-3 p-3.5 rounded-[16px] bg-[#FEF3C7]/60 border border-[#FDE68A] cursor-pointer hover:bg-[#FEF3C7] transition-all"
        >
          <input
            id="legal-compliance-checkbox"
            type="checkbox"
            checked={legalComplianceConfirmed}
            onChange={(e) => onLegalComplianceChange(e.target.checked)}
            className="w-5 h-5 rounded-[6px] text-[#0B291E] accent-[#0B291E] focus:ring-2 focus:ring-[#B88E4C] cursor-pointer"
          />
          <span className="text-xs font-bold text-[#92400E] leading-normal">
            Tôi đã đọc, hiểu rõ quy định tại Điều 644 BLDS 2015 và cam kết việc phân chia di sản này không nhằm trốn tránh nghĩa vụ cấp dưỡng theo luật định.
          </span>
        </label>
      </section>

      {/* Beneficiary Allocation List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#14241C] uppercase tracking-wider block">
              Danh Sách Người Thừa Kế ({allocations.length} người)
            </span>
            <span className="text-[11px] text-[#66786E]">
              Phân chia tỷ lệ % tương ứng cho từng người thụ hưởng
            </span>
          </div>

          <Button
            type="button"
            onClick={onAddBeneficiary}
            className="min-h-[44px] rounded-[16px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-4 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
          >
            <Plus className="w-4 h-4 text-[#B88E4C]" />
            <span>Thêm Người Thừa Kế</span>
          </Button>
        </div>

        {/* Total Allocation Progress Bar */}
        <div className="p-4 rounded-[18px] bg-[#FAF9F5] border border-[#DCD9D0] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#14241C]">Tổng Tỷ Lệ Đã Phân Bổ:</span>
            <span
              className={`font-mono text-sm ${
                isExact100
                  ? "text-[#059669]"
                  : totalPercentage > 100
                  ? "text-[#DC2626]"
                  : "text-[#B88E4C]"
              }`}
            >
              {totalPercentage}% / 100%
            </span>
          </div>

          <div className="w-full h-2.5 bg-[#EFECE6] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isExact100
                  ? "bg-[#059669]"
                  : totalPercentage > 100
                  ? "bg-[#DC2626]"
                  : "bg-[#B88E4C]"
              }`}
              style={{ width: `${Math.min(totalPercentage, 100)}%` }}
            />
          </div>

          <div className="text-[11px] text-[#66786E] flex items-center justify-between">
            <span>
              {isExact100 ? (
                <span className="text-[#059669] font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Đã phân bổ chính xác 100%
                </span>
              ) : totalPercentage > 100 ? (
                <span className="text-[#DC2626] font-bold">
                  Vượt quá {totalPercentage - 100}% - Vui lòng điều chỉnh lại
                </span>
              ) : (
                <span>Còn lại {100 - totalPercentage}% chưa phân bổ</span>
              )}
            </span>
            <span>Tối thiểu 1 người</span>
          </div>
        </div>

        {/* Allocations Rows */}
        <div className="space-y-3">
          {allocations.map((item, index) => (
            <div
              key={item.beneficiaryId || index}
              className="p-4 sm:p-5 rounded-[20px] bg-[#FAF9F5] border border-[#DCD9D0] space-y-3 shadow-sm hover:border-[#B88E4C] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#E5EDE8] text-[#0B291E] flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </div>
                  <span className="font-bold text-xs text-[#14241C]">
                    Người Thụ Hưởng #{index + 1}
                  </span>
                </div>

                {allocations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveBeneficiary(index)}
                    aria-label={`Xóa người thừa kế ${item.beneficiaryName || index + 1}`}
                    className="min-h-[44px] min-w-[44px] rounded-[12px] flex items-center justify-center text-[#DC2626] hover:bg-[#FEF2F2] transition-colors focus-visible:ring-2 focus-visible:ring-[#DC2626]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-bold text-[#66786E] mb-1">
                    Họ và Tên *
                  </label>
                  <Input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={item.beneficiaryName}
                    onChange={(e) => onUpdateBeneficiary(index, "beneficiaryName", e.target.value)}
                    className="h-11 bg-white border-[#D5D0C3] rounded-[12px] text-xs font-medium"
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-[#66786E] mb-1">
                    Mối Quan Hệ *
                  </label>
                  <Input
                    type="text"
                    placeholder="Con ruột / Vợ / Chồng..."
                    value={item.relationship}
                    onChange={(e) => onUpdateBeneficiary(index, "relationship", e.target.value)}
                    className="h-11 bg-white border-[#D5D0C3] rounded-[12px] text-xs font-medium"
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-[#66786E] mb-1">
                    Số CCCD / Định Danh *
                  </label>
                  <Input
                    type="text"
                    placeholder="079095001234"
                    value={item.citizenId}
                    onChange={(e) => onUpdateBeneficiary(index, "citizenId", e.target.value)}
                    className="h-11 bg-white border-[#D5D0C3] rounded-[12px] text-xs font-mono font-medium"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#0B291E] mb-1">
                    Tỷ Lệ (%) *
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      placeholder="50"
                      value={item.percentage || ""}
                      onChange={(e) => onUpdateBeneficiary(index, "percentage", Number(e.target.value))}
                      className="h-11 pr-7 bg-white border-[#D5D0C3] focus:border-[#B88E4C] rounded-[12px] text-xs font-bold font-mono text-[#0B291E]"
                      required
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#66786E]">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
