import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui";
import { ArrowRightLeft, ShieldCheck, AlertCircle } from "lucide-react";

/**
 * @file TransferChoiceModal.tsx
 * @description Hộp thoại chọn chuyển quyền 1:1 nguyên kho bàn giao (SRS 3.11.0 - Luồng 4B - REDIST-01 đến 06).
 * Quy tắc:
 * - Chỉ áp dụng cho kho một người (SINGLE_RECIPIENT)
 * - Chuyển nguyên kho, không chia lẻ file/phần trăm
 * - Đích đến phải là một Beneficiary hợp lệ khác trong cùng snapshot
 * - Có thể đổi đích hoặc hủy trước khi Executor bấm Bắt đầu bàn giao
 */

export interface CandidateRecipient {
  personId: string;
  fullName: string;
  emailOrPhone: string;
}

interface TransferChoiceModalProps {
  isOpen: boolean;
  handoverVaultId: string;
  vaultTitle: string;
  candidates: CandidateRecipient[];
  currentTransferTargetId?: string;
  onClose: () => void;
  onSubmitTransfer: (handoverVaultId: string, targetRecipientId: string) => void;
}

export const TransferChoiceModal: React.FC<TransferChoiceModalProps> = ({
  isOpen,
  handoverVaultId,
  vaultTitle,
  candidates,
  currentTransferTargetId = "",
  onClose,
  onSubmitTransfer,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>(currentTransferTargetId);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) {
      setError("Vui lòng chọn một người nhận đích từ danh sách");
      return;
    }

    onSubmitTransfer(handoverVaultId, selectedTargetId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#FAF9F5] border-[#DCD9D0] rounded-[24px] p-6 space-y-4">
        <DialogHeader className="space-y-1">
          <div className="w-12 h-12 rounded-[16px] bg-[#FBF7EE] flex items-center justify-center text-[#B88E4C] mx-auto mb-1 shadow-sm">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <DialogTitle className="text-base font-bold text-center text-[#0B291E]">
            Chuyển Quyền 1:1 Nguyên Kho Bàn Giao
          </DialogTitle>
          <DialogDescription className="text-xs text-center text-[#66786E]">
            Kho: <span className="font-semibold text-[#14241C]">{vaultTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Hộp giải thích chính sách REDIST */}
          <div className="p-3.5 rounded-[14px] bg-[#FBF7EE] border border-[#E8DCC6] space-y-1.5 text-xs text-[#78350F]">
            <span className="font-bold flex items-center gap-1.5 text-[#0B291E]">
              <ShieldCheck className="w-4 h-4 text-[#B88E4C]" />
              Chính sách chuyển quyền (SRS 3.11.0 - REDIST):
            </span>
            <ul className="list-disc pl-4 text-[11px] text-[#A07839] space-y-1">
              <li>Chuyển toàn bộ tài sản trong kho, không chia nhỏ hay cắt % di sản.</li>
              <li>
                Chỉ có hiệu lực dự kiến; bạn có thể đổi đích hoặc hủy chuyển cho đến khi Người thực
                thi (Executor) bấm "Bắt đầu bàn giao".
              </li>
              <li>Sau khi bắt đầu bàn giao, lựa chọn chuyển sẽ được chốt cố định.</li>
            </ul>
          </div>

          {error && (
            <div className="p-2.5 rounded-[12px] bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn Người Thụ Hưởng Đích */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#14241C]">
              Chọn Người Nhận Đích Trong Danh Sách Snapshot *
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => {
                setSelectedTargetId(e.target.value);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-[14px] bg-white border border-[#DCD9D0] text-xs font-medium text-[#14241C] focus:outline-none focus:ring-2 focus:ring-[#B88E4C]"
            >
              <option value="">-- Chọn Người Nhận Hợp Lệ --</option>
              {candidates.map((cand) => (
                <option key={cand.personId} value={cand.personId}>
                  {cand.fullName} ({cand.emailOrPhone})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-[16px] text-xs font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              className="rounded-[16px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-5"
            >
              Xác Nhận Chuyển 1:1
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
