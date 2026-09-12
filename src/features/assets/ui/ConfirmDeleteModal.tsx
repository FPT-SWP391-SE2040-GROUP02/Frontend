import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  Button 
} from "@/shared/ui";
import { AlertTriangle, Trash2 } from "lucide-react";

/**
 * @file ConfirmDeleteModal.tsx
 * @description Modal xác nhận hành động nguy hiểm (Xóa tài sản / Hủy niêm phong).
 * Tuân thủ Usability Heuristic #5 (Error Prevention) & WCAG 2.1 AA Accessibility.
 */

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  itemTitle,
  onConfirm,
  onCancel,
  isPending,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md bg-[#FAF9F5] border border-[#DCD9D0] rounded-[24px] p-6 sm:p-8 shadow-[0_8px_32px_rgba(11,41,30,0.12)]">
        <DialogHeader className="pb-3 border-b border-[#E8E5DD]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[14px] bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626] shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#14241C]">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#66786E]">
                Hành động này sẽ hủy niêm phong và xóa vĩnh viễn dữ liệu
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <p className="text-xs text-[#14241C] leading-relaxed">
            Bạn có chắc chắn muốn xóa tài sản số{" "}
            <strong className="font-bold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded-md border border-[#FECACA]">
              "{itemTitle}"
            </strong>{" "}
            khỏi két di sản?
          </p>
          <div className="p-3.5 rounded-[14px] bg-[#FFFBEB] border border-[#FDE68A] text-[11px] text-[#B45309] leading-relaxed">
            ⚠️ <strong>Cảnh báo bảo mật:</strong> Mọi khóa bí mật và liên kết người thừa kế gắn liền với tài sản này sẽ bị hủy bỏ và không thể khôi phục lại.
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-[#E8E5DD] flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto min-h-[44px] rounded-[16px] border-[#DCD9D0] text-[#14241C] hover:bg-[#EFECE6] text-xs font-semibold px-5 focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
          >
            Hủy Bỏ
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="w-full sm:w-auto min-h-[44px] rounded-[16px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold px-6 shadow-sm flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#DC2626]"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isPending ? "Đang xóa..." : "Xác Nhận Xóa"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
