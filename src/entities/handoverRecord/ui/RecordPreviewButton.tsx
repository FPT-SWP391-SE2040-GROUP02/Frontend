import { useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Printer, X } from "lucide-react";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import type { HandoverRecord } from "../model/handoverRecord.schema";
import { RecordPaper } from "./RecordPaper";

/**
 * In tờ biên bản bằng hộp thoại in của trình duyệt (người dùng chọn "Lưu thành PDF"). Tên tệp gợi ý lấy từ
 * document.title nên đổi tạm rồi trả lại khi in xong hoặc hủy.
 */
function printRecord(revisionNo: number): void {
  const previousTitle = document.title;
  document.title = `Bien-ban-ban-giao-ban-${revisionNo}`;
  function restoreTitle(): void {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restoreTitle);
  }
  window.addEventListener("afterprint", restoreTitle);
  window.print();
}

/**
 * Nút "Xem biên bản": mở khung xem trước tờ biên bản dạng văn bản, có nút in / lưu PDF. Bản in chỉ render khi khung
 * mở (portal class `print-slip`, chỉ hiện lúc in) nên PDF chỉ có tờ biên bản.
 */
export function RecordPreviewButton({ record }: { record: HandoverRecord }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={buttonStyles.outline} onClick={() => setOpen(true)}>
        <FileText className="size-4" aria-hidden="true" />
        Xem biên bản
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          aria-label="Xem trước biên bản bàn giao"
          className="flex h-[calc(100vh-2rem)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[900px] motion-reduce:animate-none"
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-heritage-border px-5 py-3.5">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold">Biên bản bàn giao</DialogTitle>
              <DialogDescription className="sr-only">
                Tờ biên bản bàn giao điền từ dữ liệu biên bản trên hệ thống.
              </DialogDescription>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className={buttonStyles.outline}
                onClick={() => printRecord(record.revisionNo)}
              >
                <Printer className="size-4" aria-hidden="true" />
                In / Lưu PDF
              </button>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setOpen(false)}
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-heritage-text hover:bg-heritage-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
              >
                <X className="size-6" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-heritage-canvas px-3 py-6 sm:px-8">
            <article
              aria-label="Tờ biên bản bàn giao"
              className="mx-auto max-w-[794px] bg-white px-6 py-10 shadow-md sm:px-14"
            >
              <RecordPaper record={record} />
            </article>
          </div>
        </DialogContent>
      </Dialog>
      {open &&
        createPortal(
          <div className="print-slip" aria-hidden="true">
            <section className="w-full bg-white text-[#111]">
              <RecordPaper record={record} />
            </section>
          </div>,
          document.body,
        )}
    </>
  );
}
