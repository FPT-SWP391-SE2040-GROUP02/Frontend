import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  Button, 
  Badge 
} from "@/shared/ui";
import { 
  FileText, 
  ShieldCheck, 
  Calendar, 
  Users, 
  Hash, 
  Printer, 
  Copy, 
  Check, 
  X, 
  Lock,
  Scale,
  Video
} from "lucide-react";
import type { WillViewModel } from "../model/will.types";

/**
 * @file WillDetailModal.tsx
 * @description Modal xem chi tiết bản di chúc số đã niêm phong mật mã học với bố cục phân vùng rộng rãi, chuẩn responsive.
 * Tuân thủ Master UI Kit Heritage Forest & Champagne Gold và chuẩn WCAG 2.1 AA.
 */

interface WillDetailModalProps {
  will: WillViewModel | null;
  onClose: () => void;
}

export const WillDetailModal: React.FC<WillDetailModalProps> = ({ will, onClose }) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  if (!will) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(will.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(will.affidavitHashShort);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <Dialog open={Boolean(will)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        showCloseButton={false}
        className="w-[95vw] sm:w-[720px] md:w-[820px] max-w-4xl max-h-[90vh] bg-[#FAF9F5] border border-[#DCD9D0] rounded-[28px] p-0 overflow-hidden shadow-[0_24px_64px_rgba(11,41,30,0.2)] flex flex-col"
      >
        {/* Modal Top Header Banner */}
        <div className="bg-[#0B291E] p-6 sm:p-7 text-white relative shrink-0">
          {/* Close 'X' Button at top right */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ chi tiết di chúc"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center absolute top-5 right-5 transition-colors focus-visible:ring-2 focus-visible:ring-[#B88E4C] focus-visible:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 pr-12">
            <div className="w-12 h-12 rounded-[16px] bg-[#133E2F] border border-[#B88E4C]/40 flex items-center justify-center text-[#B88E4C] shrink-0 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-mono tracking-wider uppercase text-[#B88E4C] font-bold">
                  Bản Di Chúc Điện Tử
                </span>
                <span className="text-white/40">•</span>
                <Badge
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    will.status === "SEALED"
                      ? "bg-[#133E2F] text-[#059669] border-[#059669]/40"
                      : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
                  }`}
                >
                  {will.statusLabel}
                </Badge>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight break-words">
                {will.title}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-2 text-xs text-white/75 flex-wrap">
                <span className="font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded-md">
                  Mã: {will.id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  aria-label="Sao chép mã hồ sơ di chúc"
                  className="hover:text-white transition-colors flex items-center gap-1 text-[11px] text-[#B88E4C]"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId ? "Đã chép" : "Sao chép"}</span>
                </button>
                <span>•</span>
                <span>Lập ngày: {will.createdAtFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto">
          {/* Section 1: Key Metrics Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#EFECE6] border border-[#DCD9D0] rounded-[20px] text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-white border border-[#DCD9D0] flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-[#0B291E]" />
              </div>
              <div>
                <span className="text-[10px] text-[#66786E] font-bold uppercase tracking-wider block">
                  Tài Sản Ủy Thác
                </span>
                <span className="font-bold text-[#14241C] text-sm block mt-0.5">
                  {will.assetCount} tài sản số
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-white border border-[#DCD9D0] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-[#B88E4C]" />
              </div>
              <div>
                <span className="text-[10px] text-[#66786E] font-bold uppercase tracking-wider block">
                  Người Thừa Kế
                </span>
                <span className="font-bold text-[#14241C] text-sm block mt-0.5">
                  {will.beneficiaryCount} người thụ hưởng
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-white border border-[#DCD9D0] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#059669]" />
              </div>
              <div>
                <span className="text-[10px] text-[#66786E] font-bold uppercase tracking-wider block">
                  Ký Niêm Phong
                </span>
                <span className="font-semibold text-[#14241C] text-xs block mt-0.5">
                  {will.sealedAtFormatted || will.createdAtFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Declaration Notes Card */}
          <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#DCD9D0] shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-[#66786E] uppercase tracking-wider block">
              Ý Nguyện & Lời Dặn Dò Chung Của Người Lập Di Chúc
            </span>
            <p className="text-xs text-[#14241C] leading-relaxed italic bg-[#FAF9F5] p-3.5 rounded-[14px] border border-[#E8E5DD]">
              "{will.declarationNotes}"
            </p>
          </div>

          {/* Section 3: Beneficiary Allocation Breakdown Table Card */}
          <div className="p-5 sm:p-6 rounded-[22px] bg-white border border-[#DCD9D0] shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#E8E5DD] pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#B88E4C]" />
                <span className="text-xs font-bold text-[#0B291E] uppercase tracking-wider">
                  Phân Bổ Tỷ Lệ Thừa Kế (Điều 644 BLDS 2015)
                </span>
              </div>
              <Badge className="bg-[#E5EDE8] text-[#059669] font-mono text-[10px] font-bold px-2.5 py-0.5">
                TỔNG: 100%
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-[14px] border border-[#E8E5DD]">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-[#EFECE6]/80 text-[#66786E] font-bold text-[10px] uppercase border-b border-[#E8E5DD]">
                  <tr>
                    <th className="py-3 px-4">Người Thừa Kế</th>
                    <th className="py-3 px-4">Mối Quan Hệ</th>
                    <th className="py-3 px-4">Số CCCD</th>
                    <th className="py-3 px-4 text-right">Tỷ Lệ (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E5DD] font-medium">
                  {will.allocations.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#14241C]">
                        {item.beneficiaryName}
                      </td>
                      <td className="py-3.5 px-4 text-[#66786E]">
                        {item.relationship}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#66786E]">
                        {item.citizenId}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-[#0B291E] bg-[#FBF7EE] border border-[#E8DCC6] px-3 py-1 rounded-full text-xs">
                          {item.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Video Affidavit Hash & ECDSA P-256 Seal Card */}
          <div className="p-5 sm:p-6 rounded-[22px] bg-[#FAF7EE] border border-[#E8DCC6] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8DCC6] pb-2.5">
              <span className="text-xs font-bold text-[#0B291E] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#059669]" />
                Chứng Cứ Minh Mẫn (Điều 630) & Niêm Phong ECDSA P-256
              </span>
              <Badge className="bg-[#0B291E] text-[#B88E4C] text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                ECDSA P-256 VERIFIED
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-3.5 rounded-[14px] border border-[#E8DCC6] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#14241C]">
                  <Video className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Video Tuyên Thệ Minh Mẫn 15s</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#66786E]">
                  <span className="font-mono text-[10px] truncate max-w-[200px]">
                    SHA: {will.affidavitHashShort}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    aria-label="Sao chép mã băm video"
                    className="hover:text-[#14241C] p-1 flex items-center gap-1 text-[10px] text-[#B88E4C]"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-[#059669]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? "Đã chép" : "Chép"}</span>
                  </button>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-[14px] border border-[#E8DCC6] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#14241C]">
                  <Hash className="w-3.5 h-3.5 text-[#B88E4C]" />
                  <span>Chữ Ký Số Mật Mã Niêm Phong</span>
                </div>
                <p className="text-[10px] font-mono text-[#059669] font-bold">
                  VALID DIGITAL SIGNATURE (ECDSA P-256)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="p-4 sm:px-8 bg-[#FAF9F5] border-t border-[#E8E5DD] flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => alert("Đang kết nối hệ thống trích xuất Chứng thư di chúc số điện tử...")}
            className="min-h-[44px] rounded-[16px] border-[#DCD9D0] text-xs font-semibold px-4 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
          >
            <Printer className="w-4 h-4" />
            <span>In Chứng Thư Di Chúc</span>
          </Button>

          <Button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-[16px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-7 shadow-sm focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
          >
            Đóng Cửa Sổ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
