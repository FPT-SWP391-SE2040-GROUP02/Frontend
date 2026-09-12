import React from "react";
import { 
  Badge 
} from "@/shared/ui";
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  FileCheck, 
  Users, 
  CheckCircle,
  AlertCircle,
  Hash
} from "lucide-react";
import type { CreateWillFormValues } from "../model/will.types";
import { useAssets } from "@/features/assets";

/**
 * @file Step4CryptographicSeal.tsx
 * @description Bước 4 của Digital Will Wizard: Đối soát tổng thể, Ký số mật mã học ECDSA P-256 và Niêm phong di chúc.
 */

interface Step4CryptographicSealProps {
  formValues: CreateWillFormValues;
  onConfirmSignatureChange: (confirmed: boolean) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export const Step4CryptographicSeal: React.FC<Step4CryptographicSealProps> = ({
  formValues,
  onConfirmSignatureChange,
  isSubmitting,
  errorMessage,
}) => {
  const { data: assetsData } = useAssets();

  const selectedAssets = assetsData?.items.filter((a) =>
    formValues.selectedAssetIds.includes(a.id)
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#14241C]">
          Bước 4: Đối Soát Ý Chí & Ký Số Niêm Phong Di Chúc
        </h2>
        <p className="text-xs text-[#66786E] mt-1 leading-relaxed">
          Kiểm tra kỹ lưỡng toàn bộ thông tin tài sản, tỷ lệ phân chia cho người thừa kế và chứng cứ video minh mẫn trước khi gắn chữ ký số ECDSA P-256 niêm phong vĩnh viễn.
        </p>
      </div>

      {errorMessage && (
        <div 
          role="alert" 
          className="p-3.5 rounded-[14px] bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-2 text-xs text-[#DC2626] font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Overview Card */}
      <div className="p-6 rounded-[24px] bg-[#FAF9F5] border border-[#DCD9D0] space-y-6 shadow-sm">
        {/* Basic Will Info */}
        <div className="border-b border-[#E8E5DD] pb-4">
          <span className="text-[11px] font-bold text-[#66786E] uppercase tracking-wider block">
            Tiêu Đề Di Chúc Số
          </span>
          <h3 className="text-lg font-black text-[#0B291E] mt-0.5">
            {formValues.title}
          </h3>
          {formValues.declarationNotes && (
            <p className="text-xs text-[#14241C] mt-2 italic bg-white p-3 rounded-[12px] border border-[#DCD9D0] leading-relaxed">
              "{formValues.declarationNotes}"
            </p>
          )}
        </div>

        {/* Selected Assets List */}
        <div className="border-b border-[#E8E5DD] pb-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#14241C]">
            <span className="uppercase tracking-wider">
              Tài Sản Đưa Vào Di Chúc ({selectedAssets.length} tài sản)
            </span>
            <span className="text-[#059669] flex items-center gap-1 font-semibold">
              <Lock className="w-3.5 h-3.5" /> AES-256-GCM
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedAssets.map((asset) => (
              <div
                key={asset.id}
                className="p-3 bg-white rounded-[14px] border border-[#DCD9D0] flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-[#14241C] block">
                    {asset.title}
                  </span>
                  <span className="text-[10px] text-[#66786E] block">
                    {asset.typeLabel}
                  </span>
                </div>
                <Badge className="bg-[#E5EDE8] text-[#0B291E] text-[10px] font-mono">
                  {asset.shamirThresholdText}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Beneficiaries Allocation Breakdown */}
        <div className="border-b border-[#E8E5DD] pb-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#14241C]">
            <span className="uppercase tracking-wider">
              Phân Bổ Thừa Kế ({formValues.allocations.length} người)
            </span>
            <span className="text-[#059669] font-mono text-sm">Tổng: 100%</span>
          </div>

          <div className="overflow-x-auto rounded-[14px] border border-[#DCD9D0]">
            <table className="w-full text-left text-xs bg-white">
              <thead className="bg-[#EFECE6]/70 text-[#66786E] font-bold text-[10px] uppercase border-b border-[#DCD9D0]">
                <tr>
                  <th className="py-2.5 px-3">Người Thừa Kế</th>
                  <th className="py-2.5 px-3">Mối Quan Hệ</th>
                  <th className="py-2.5 px-3">Số CCCD</th>
                  <th className="py-2.5 px-3 text-right">Tỷ Lệ Hưởng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5DD] font-medium">
                {formValues.allocations.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-bold text-[#14241C]">
                      {item.beneficiaryName}
                    </td>
                    <td className="py-2.5 px-3 text-[#66786E]">
                      {item.relationship}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#66786E]">
                      {item.citizenId}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#0B291E]">
                      {item.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Affidavit Video Proof Summary */}
        <div className="border-b border-[#E8E5DD] pb-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#14241C] uppercase tracking-wider">
              Chứng Cứ Video Minh Mẫn (Điều 630 BLDS)
            </span>
            <span className="text-xs font-bold text-[#059669] flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Đạt chuẩn 15s
            </span>
          </div>

          <div className="p-3 bg-white rounded-[12px] border border-[#DCD9D0] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <Hash className="w-4 h-4 text-[#B88E4C] shrink-0" />
              <span className="font-mono text-[11px] text-[#66786E] truncate">
                SHA-256: {formValues.affidavitProof.sha256Hash || "N/A"}
              </span>
            </div>
            <span className="text-[10px] text-[#66786E] shrink-0 font-medium">
              15 Giây
            </span>
          </div>
        </div>

        {/* Cryptographic Seal Verification */}
        <div className="p-4 rounded-[18px] bg-[#E5EDE8] border border-[#A2C4AF] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B291E]">
            <ShieldCheck className="w-5 h-5 text-[#059669]" />
            <span>Niêm Phong Mật Mã Học ECDSA P-256 (Client-Side Key Signature)</span>
          </div>
          <p className="text-[11px] text-[#0B291E]/90 leading-relaxed">
            Hệ thống sẽ tạo chữ ký số mật mã học bằng khóa riêng tư của bạn để niêm phong toàn bộ nội dung bản di chúc này. Dữ liệu sau khi niêm phong không thể chỉnh sửa hay làm giả mà không bị phát hiện bởi Công chứng viên.
          </p>
        </div>

        {/* Digital Signature Confirmation Checkbox */}
        <label 
          htmlFor="digital-signature-checkbox"
          className="flex items-start gap-3 p-4 rounded-[18px] bg-[#FFFBEB] border border-[#FDE68A] cursor-pointer hover:bg-[#FEF3C7] transition-all"
        >
          <input
            id="digital-signature-checkbox"
            type="checkbox"
            checked={formValues.confirmDigitalSignature}
            onChange={(e) => onConfirmSignatureChange(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded-[6px] text-[#0B291E] accent-[#0B291E] focus:ring-2 focus:ring-[#B88E4C] cursor-pointer"
          />
          <div className="text-xs text-[#92400E] leading-relaxed">
            <span className="font-bold block mb-0.5">
              Xác Nhận Ký Số & Niêm Phong Vĩnh Viễn Bản Di Chúc *
            </span>
            <span>
              Tôi xác nhận toàn bộ nội dung di chúc là đúng với ý nguyện tự nguyện của tôi và đồng ý ký số niêm phong để chuyển giao hồ sơ sang trạng thái sẵn sàng bàn giao pháp lý.
            </span>
          </div>
        </label>
      </div>
    </div>
  );
};
