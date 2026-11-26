import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FileText, Printer, X } from "lucide-react";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";

/**
 * In tờ giấy bằng hộp thoại in của trình duyệt (người dùng chọn "Lưu thành PDF"). Tên tệp gợi ý lấy từ
 * document.title nên đổi tạm rồi trả lại khi in xong hoặc hủy.
 */
function printPaper(fileName: string): void {
  const previousTitle = document.title;
  document.title = fileName;
  function restoreTitle(): void {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restoreTitle);
  }
  window.addEventListener("afterprint", restoreTitle);
  window.print();
}

/**
 * Nút mở khung xem trước một tờ giấy dạng văn bản (biên bản, phiếu giao nhận, phiếu gửi), có nút in / lưu PDF. Bản in chỉ render khi khung
 * mở (portal class `print-slip`, chỉ hiện lúc in) nên PDF chỉ có tờ giấy đó.
 */
export function PaperPreviewButton({
  label,
  title,
  fileName,
  paper,
  onOpen,
  onClose,
  printDisabled = false,
  primary = false,
}: {
  /** Chữ trên nút. */
  label: string;
  /** Tên tờ giấy trên khung xem trước. */
  title: string;
  /** Tên tệp gợi ý khi lưu PDF, không dấu. */
  fileName: string;
  paper: ReactNode;
  /** Gọi khi người dùng mở tờ giấy (để biết họ đã xem trước khi ký). */
  onOpen?: () => void;
  onClose?: () => void;
  /** Khóa nút in khi tờ giấy chưa tải xong. */
  printDisabled?: boolean;
  /** Nút nền đậm: đây là việc người dùng cần làm tiếp theo. */
  primary?: boolean;
}) {
  const [open, setOpen] = useState(false);
  let buttonClass = buttonStyles.outline;
  if (primary) {
    buttonClass = buttonStyles.dark;
  }
  return (
    <>
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          setOpen(true);
          onOpen?.();
        }}
      >
        <FileText className="size-4" aria-hidden="true" />
        {label}
      </button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) onClose?.();
        }}
      >
        <DialogContent
          showCloseButton={false}
          aria-label={`Xem trước ${title}`}
          className="flex h-[calc(100vh-2rem)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[900px] motion-reduce:animate-none"
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-heritage-border px-5 py-3.5">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              <DialogDescription className="sr-only">
                {`${title} điền từ dữ liệu trên hệ thống.`}
              </DialogDescription>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className={buttonStyles.outline}
                disabled={printDisabled}
                onClick={() => printPaper(fileName)}
              >
                <Printer className="size-4" aria-hidden="true" />
                In / Lưu PDF
              </button>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => {
                  setOpen(false);
                  onClose?.();
                }}
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-heritage-text hover:bg-heritage-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
              >
                <X className="size-6" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-heritage-canvas px-3 py-6 sm:px-8">
            <article
              aria-label={`Tờ ${title}`}
              className="mx-auto max-w-[794px] bg-white px-6 py-10 shadow-md sm:px-14"
            >
              {paper}
            </article>
          </div>
        </DialogContent>
      </Dialog>
      {open &&
        createPortal(
          <div className="print-slip" aria-hidden="true">
            <section className="w-full bg-white text-[#111]">{paper}</section>
          </div>,
          document.body,
        )}
    </>
  );
}
