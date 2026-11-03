import { useEffect, useId, useState, type DragEvent } from "react";
import { Crop, Upload } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ImageCropModal } from "./ImageCropModal";

/** Chọn ảnh bằng bấm hoặc kéo thả; hỗ trợ cắt/xoay ảnh thẻ trước khi gửi OCR. */
export function EkycDropzone({
  title,
  inputLabel,
  file,
  onFile,
  disabled,
}: {
  title: string;
  /** Tên truy cập của ô chọn tệp (người dùng bàn phím/đọc màn hình). */
  inputLabel: string;
  file: File | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  // Xem trước đọc ảnh thành data URL trong RAM (không dùng blob URL cần thu hồi, tránh vỡ ảnh khi React Strict Mode
  // chạy effect hai lần ở môi trường dev). Cặp {file, url} để ảnh cũ không hiện khi đã đổi sang tệp khác.
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    if (!file || typeof FileReader === "undefined") {
      return;
    }
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled && typeof reader.result === "string") {
        setPreview({ file, url: reader.result });
      }
    };
    reader.readAsDataURL(file);
    return () => {
      cancelled = true;
    };
  }, [file]);

  let previewUrl: string | null = null;
  if (file && preview && preview.file === file) {
    previewUrl = preview.url;
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragging(false);
    if (disabled) {
      return;
    }
    const dropped = event.dataTransfer.files.item(0);
    if (dropped) {
      onFile(dropped);
    }
  }

  let border = "border-green-700/40";
  if (dragging) {
    border = "border-[#B68F4C] bg-[#F1E7D0]/50";
  }
  let fileName = "";
  let hint = "Kéo ảnh vào đây hoặc bấm để chọn";
  let pickLabel = "Chọn ảnh";
  if (file) {
    fileName = file.name;
    hint = file.name;
    pickLabel = "Chọn ảnh khác";
  }
  let labelState = "";
  if (disabled) {
    labelState = "pointer-events-none opacity-50";
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center ${border}`}
    >
      {previewUrl && (
        <div className="relative flex max-h-48 items-center justify-center overflow-hidden rounded-xl border border-heritage-border bg-heritage-surface p-1">
          <img
            src={previewUrl}
            alt={`Ảnh đã chọn: ${fileName}`}
            className="max-h-40 rounded-lg object-contain"
          />
        </div>
      )}
      {!previewUrl && (
        <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-heritage-border bg-heritage-surface">
          <span className="block h-10 w-20 rounded bg-heritage-canvas" aria-hidden="true" />
        </div>
      )}
      <p className="text-lg font-semibold">{title}</p>
      <p className="break-all text-sm text-heritage-muted">{hint}</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <label
          htmlFor={inputId}
          className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-[#1d4d3c] px-6 text-sm font-semibold text-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-heritage-gold ${labelState}`}
        >
          <Upload className="size-4" aria-hidden="true" />
          {pickLabel}
        </label>

        {file && !disabled && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setCropOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border-heritage-gold/80 bg-heritage-surface px-5 text-sm font-semibold text-heritage-primary hover:bg-[#F1E7D0]"
          >
            <Crop className="size-4 text-heritage-gold" aria-hidden="true" />
            Cắt & xoay thẻ
          </Button>
        )}
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png"
        aria-label={inputLabel}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />
      <p className="text-xs text-heritage-muted">JPG, PNG · Tối đa 8 MiB</p>

      {file && (
        <ImageCropModal open={cropOpen} onOpenChange={setCropOpen} file={file} onCrop={onFile} />
      )}
    </div>
  );
}
