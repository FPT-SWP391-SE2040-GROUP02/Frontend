import React from "react";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  ShieldCheck 
} from "lucide-react";
import { Card, Badge } from "@/shared/ui";
import type { ClaimItemViewModel } from "../model/claim.types";

/**
 * @file ClaimStatusCard.tsx
 * @description Thẻ hiển thị trạng thái và tiến độ xử lý của từng hồ sơ yêu cầu mở thừa kế.
 */

export interface ClaimStatusCardProps {
  claim: ClaimItemViewModel;
}

export const ClaimStatusCard: React.FC<ClaimStatusCardProps> = ({ claim }) => {
  const getStatusBadge = () => {
    switch (claim.claimStatus) {
      case "CLAIM_PENDING":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>Đang Thẩm Định</span>
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã Phê Duyệt</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-800 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Yêu Cầu Bổ Sung</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
            <span>{claim.claimStatus}</span>
          </span>
        );
    }
  };

  return (
    <Card className="p-5 bg-[#FAF9F5] border-[#DCD9D0] rounded-[20px] shadow-sm space-y-4 hover:border-[#B88E4C] transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFECE6] pb-3">
        <div>
          <span className="text-[10px] font-bold text-[#66786E] uppercase tracking-wider">
            Hồ Sơ Mở Thừa Kế • #{claim.id}
          </span>
          <h4 className="text-sm font-bold text-[#0B291E] mt-0.5">{claim.vaultTitle}</h4>
        </div>
        {getStatusBadge()}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[#66786E] block text-[11px]">Chủ Kho Di Sản:</span>
          <span className="font-bold text-[#14241C]">{claim.ownerFullName}</span>
          <span className="text-[#66786E] block text-[10px]">CCCD: {claim.ownerNationalId}</span>
        </div>
        <div>
          <span className="text-[#66786E] block text-[11px]">Số Hiệu Chứng Từ:</span>
          <span className="font-bold text-[#14241C]">{claim.deathCertificateNumber}</span>
          <span className="text-[#66786E] block text-[10px]">Cấp ngày: {claim.deathCertificateIssueDate}</span>
        </div>
      </div>

      {/* Thông tin thẩm định của Công chứng viên */}
      {claim.notaryNotes && (
        <div className={`p-3 rounded-xl text-xs space-y-1 ${
          claim.claimStatus === "REJECTED" ? "bg-red-50 text-red-800 border border-red-200" : "bg-[#E5EDE8] text-[#0B291E]"
        }`}>
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-[#B88E4C]" />
            <span>Nhận xét của Công chứng viên ({claim.reviewedByNotaryName || "Notary"}):</span>
          </div>
          <p className="text-[11px] leading-relaxed pl-5">{claim.notaryNotes}</p>
        </div>
      )}

      {/* Mã băm toàn vẹn SHA-256 */}
      <div className="p-2.5 rounded-xl bg-[#EFECE6] text-[10px] text-[#66786E] space-y-0.5">
        <span className="font-bold text-[#0B291E] block">Mã băm SHA-256 tệp scan:</span>
        <p className="font-mono truncate select-all">{claim.deathCertScanHash}</p>
      </div>
    </Card>
  );
};
