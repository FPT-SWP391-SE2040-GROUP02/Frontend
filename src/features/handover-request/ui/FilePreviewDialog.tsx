import { useState } from "react";
import { RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { previewKind } from "../model/fileLabel";
import { useObjectUrl } from "../model/useObjectUrl";

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.4;
const ZOOM_STEP = 0.2;

const TOOL_BUTTON =
  "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-heritage-muted hover:bg-heritage-sunken hover:text-heritage-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold-hover disabled:pointer-events-none disabled:opacity-40";

function PreviewBody({ file }: { file: File }) {
  const kind = previewKind(file);
  const url = useObjectUrl(file);
  const [turns, setTurns] = useState(0);
  const [zoom, setZoom] = useState(1);
  const sideways = turns % 2 === 1;
  // Ảnh xoay ngang thì đổi chiều rộng và cao để vẫn nằm trọn trong khung.
  let width = `${zoom * 100}cqw`;
  let height = `${zoom * 100}cqh`;
  if (sideways) {
    width = `${zoom * 100}cqh`;
    height = `${zoom * 100}cqw`;
  }

  return (
    <>
      <div className="flex items-center gap-1 border-b border-heritage-border py-2 pr-2 pl-4">
        <div className="min-w-0 flex-1">
          <DialogTitle className="truncate font-sans text-sm" title={file.name}>
            {file.name}
          </DialogTitle>
          <p className="text-xs text-heritage-muted">{formatStorageSize(file.size)}</p>
        </div>
        {kind === "image" && (
          <>
            <button
              type="button"
              className={TOOL_BUTTON}
              aria-label="Xoay ảnh"
              onClick={() => setTurns(turns + 1)}
            >
              <RotateCw className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={TOOL_BUTTON}
              aria-label="Thu nhỏ"
              disabled={zoom <= MIN_ZOOM}
              onClick={() => setZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
            >
              <ZoomOut className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={TOOL_BUTTON}
              aria-label="Phóng to"
              disabled={zoom >= MAX_ZOOM}
              onClick={() => setZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
            >
              <ZoomIn className="size-4" aria-hidden="true" />
            </button>
          </>
        )}
        <DialogClose className={TOOL_BUTTON} aria-label="Đóng">
          <X className="size-5" aria-hidden="true" />
        </DialogClose>
      </div>

      <div className="[container-type:size] h-[70vh] overflow-auto bg-neutral-900">
        {url && kind === "image" && (
          <div
            className="relative mx-auto overflow-hidden"
            style={{
              width: `${Math.max(zoom, 1) * 100}cqw`,
              height: `${Math.max(zoom, 1) * 100}cqh`,
            }}
          >
            <img
              src={url}
              alt={`Xem trước ${file.name}`}
              className="absolute top-1/2 left-1/2 max-w-none object-contain p-3 transition-[rotate,width,height] duration-200 ease-out"
              style={{ width, height, translate: "-50% -50%", rotate: `${turns * 90}deg` }}
            />
          </div>
        )}
        {url && kind === "pdf" && (
          <iframe src={url} title={`Xem trước ${file.name}`} className="size-full bg-white" />
        )}
        {(!url || kind === "none") && (
          <p className="flex h-full items-center justify-center p-6 text-center text-white">
            Không xem trước được tệp này.
          </p>
        )}
      </div>

      {url && kind === "pdf" && (
        <p className="border-t border-heritage-border px-4 py-2 text-xs text-heritage-muted">
          Không thấy nội dung?{" "}
          <a
            className="font-semibold text-heritage-primary underline"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            Mở trong thẻ mới
          </a>
        </p>
      )}
    </>
  );
}

/** Xem lại tệp đã chọn trước khi gửi; tệp chỉ đọc trong trình duyệt, chưa gửi đi đâu. */
export function FilePreviewDialog({ file, onClose }: { file: File | null; onClose: () => void }) {
  return (
    <Dialog
      open={file !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {file && (
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden p-0 sm:max-w-3xl sm:p-0"
        >
          <PreviewBody file={file} />
        </DialogContent>
      )}
    </Dialog>
  );
}
