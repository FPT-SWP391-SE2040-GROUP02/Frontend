// ==============================================================================
// SWP391 - LegacyVault: ConfirmDialog UI Component
// Popup xác nhận hành động quan trọng/nguy hiểm (Xóa tài sản, Niêm phong kho...)
// ==============================================================================

import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from "@/shared/ui";

/**
 * @description Props cho ConfirmDialog component.
 */
export interface ConfirmDialogProps {
  /** Trạng thái mở/đóng của dialog */
  isOpen: boolean;
  /** Tiêu đề xác nhận */
  title: string;
  /** Nội dung giải thích hoặc cảnh báo */
  description: string;
  /** Nhãn nút xác nhận (Mặc định: "Xác nhận") */
  confirmText?: string;
  /** Nhãn nút hủy (Mặc định: "Hủy bỏ") */
  cancelText?: string;
  /** Hành động nguy hiểm / phá hủy dữ liệu (đổi màu nút sang đỏ) */
  isDestructive?: boolean;
  /** Trạng thái đang thực thi xác nhận (loading spinner) */
  isLoading?: boolean;
  /** Callback khi người dùng bấm xác nhận */
  onConfirm: () => void;
  /** Callback khi người dùng bấm hủy hoặc đóng */
  onClose: () => void;
}

/**
 * @description Component Popup xác nhận hành động kèm cảnh báo trực quan.
 * @param {ConfirmDialogProps} props Thuộc tính của ConfirmDialog
 * @returns {React.JSX.Element} ConfirmDialog JSX
 * @example
 * ```tsx
 * <ConfirmDialog
 *   isOpen={isDeleteOpen}
 *   title="Xác nhận xóa tài sản số"
 *   description="Hành động này sẽ xóa vĩnh viễn khóa bí mật khỏi kho di sản."
 *   isDestructive
 *   onConfirm={handleDelete}
 *   onClose={() => setIsDeleteOpen(false)}
 * />
 * ```
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#FAF9F5] dark:bg-[#0A1D15] border border-border shadow-2xl p-6">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDestructive
                  ? "bg-destructive/10 text-destructive"
                  : "bg-[#B88E4C]/15 text-[#B88E4C]"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Vui lòng xác nhận trước khi tiếp tục
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="text-xs text-muted-foreground leading-relaxed py-2">
          {description}
        </p>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-border/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className={`text-xs ${
              isDestructive
                ? "bg-destructive hover:bg-destructive/90 text-white"
                : "btn-gold"
            }`}
          >
            {isLoading ? "Đang xử lý..." : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
