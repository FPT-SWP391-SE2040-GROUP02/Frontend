import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
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
      <DialogContent className="max-w-md bg-heritage-surface border border-heritage-border rounded-[24px] p-6 sm:p-8 shadow-[0_8px_32px_rgba(11,41,30,0.12)]">
        <DialogHeader className="pb-3 border-b border-heritage-neutral-bg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[14px] bg-heritage-danger-bg border border-heritage-danger/30 flex items-center justify-center text-heritage-danger shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-heritage-text">{title}</DialogTitle>
              <DialogDescription className="text-xs text-heritage-muted">
                Hành động này sẽ hủy niêm phong và xóa vĩnh viễn dữ liệu
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <p className="text-xs text-heritage-text leading-relaxed">
            Bạn có chắc chắn muốn xóa tài sản số{" "}
            <strong className="font-bold text-heritage-danger bg-heritage-danger-bg px-2 py-0.5 rounded-md border border-heritage-danger/30">
              "{itemTitle}"
            </strong>{" "}
            khỏi két di sản?
          </p>
          <div className="p-3.5 rounded-[14px] bg-heritage-warning-bg border border-[#FDE68A] text-[11px] text-heritage-warning leading-relaxed">
            ⚠️ <strong>Cảnh báo bảo mật:</strong> Mọi khóa bí mật và liên kết người thừa kế gắn liền
            với tài sản này sẽ bị hủy bỏ và không thể khôi phục lại.
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-heritage-neutral-bg flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto min-h-[44px] rounded-[16px] border-heritage-border text-heritage-text hover:bg-heritage-canvas text-xs font-semibold px-5 focus-visible:ring-2 focus-visible:ring-heritage-gold"
          >
            Hủy Bỏ
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="w-full sm:w-auto min-h-[44px] rounded-[16px] bg-heritage-danger hover:bg-[#B91C1C] text-white text-xs font-bold px-6 shadow-sm flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-heritage-danger"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isPending ? "Đang xóa..." : "Xác Nhận Xóa"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
