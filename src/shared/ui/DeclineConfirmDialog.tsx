import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { buttonStyles } from "@/shared/ui/heritageKit";

/**
 * Hỏi lại trước khi từ chối hoặc không đồng ý, để một cú bấm nhầm không gửi câu trả lời đi. Nút "Quay lại" đứng
 * trước nên được đặt con trỏ khi hộp mở.
 */
export function DeclineConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-heritage-surface p-7" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-heritage-primary">{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-sm leading-6">{description}</DialogDescription>
        {/* Lề âm khớp lề hộp thoại: p-7 ở màn hẹp, sm:p-6 từ màn rộng. */}
        <DialogFooter className="-mx-7 -mb-7 bg-heritage-surface px-7 sm:-mx-6 sm:-mb-6 sm:px-6">
          <button type="button" className={buttonStyles.outline} onClick={onClose}>
            Quay lại
          </button>
          <button type="button" className={buttonStyles.danger} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
