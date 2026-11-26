import { useEffect, useState } from "react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { compactButton } from "@/shared/ui/SectionCard";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import type { RecordFile } from "../model/handoverRecord.schema";

/** Chỉ các loại này được hiện ngay trong trang; loại khác (ví dụ HTML) không bao giờ được mở trong trang. */
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PREVIEW_TYPES = ["application/pdf", ...IMAGE_TYPES];

/** Nút xem trước một tệp đính kèm trong hộp ngay trên trang, không phải tải về máy. */
export function FilePreviewButton({
  file,
  download,
}: {
  file: RecordFile;
  download: () => Promise<Blob>;
}) {
  const action = usePrivateAction();
  const [url, setUrl] = useState<string | null>(null);

  // Địa chỉ tạm giữ nội dung tệp trong bộ nhớ: thu hồi ngay khi đóng hộp hoặc rời trang.
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  if (!PREVIEW_TYPES.includes(file.contentType)) return null;

  return (
    <>
      <button
        type="button"
        className={compactButton.outline}
        disabled={action.pending}
        aria-label={`Xem ${file.fileName}`}
        onClick={() =>
          void action.execute(download, (blob) =>
            // Gắn lại loại tệp theo danh sách cho phép, không tin loại máy chủ gửi kèm nội dung.
            setUrl(URL.createObjectURL(new Blob([blob], { type: file.contentType }))),
          )
        }
      >
        {action.pending ? "Đang mở…" : "Xem"}
      </button>
      {action.error && (
        <p role="alert" className="basis-full text-sm text-destructive">
          {action.error}
        </p>
      )}
      {url && (
        <Dialog open onOpenChange={(open) => !open && setUrl(null)}>
          <DialogContent className="flex h-[calc(100vh-2rem)] w-full max-w-[calc(100%-2rem)] flex-col gap-3 sm:max-w-[900px]">
            <DialogTitle className="break-all pr-10 text-lg font-semibold">
              {file.fileName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Xem trước tệp đính kèm. Đóng hộp để quay lại hồ sơ.
            </DialogDescription>
            {IMAGE_TYPES.includes(file.contentType) ? (
              <img
                src={url}
                alt={file.fileName}
                className="min-h-0 flex-1 rounded-xl bg-heritage-sunken object-contain"
              />
            ) : (
              <iframe
                src={url}
                title={`Nội dung ${file.fileName}`}
                className="min-h-0 w-full flex-1 rounded-xl border border-heritage-border"
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
