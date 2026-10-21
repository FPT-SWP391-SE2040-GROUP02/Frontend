import { useEffect, useId, useMemo, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";

/** Chọn ảnh bằng bấm hoặc kéo thả; xem trước chỉ trong RAM (blob URL) và được thu hồi khi đổi/đóng. */
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
  // Blob URL chỉ để xem trước trong RAM; môi trường không có createObjectURL thì bỏ qua xem trước.
  const previewUrl = useMemo(() => {
    if (!file || typeof URL.createObjectURL !== "function") {
      return null;
    }
    return URL.createObjectURL(file);
  }, [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
        <img
          src={previewUrl}
          alt={`Ảnh đã chọn: ${fileName}`}
          className="max-h-40 rounded-lg border border-heritage-border object-contain"
        />
      )}
      {!previewUrl && (
        <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-heritage-border bg-heritage-surface">
          <span className="block h-10 w-20 rounded bg-heritage-canvas" aria-hidden="true" />
        </div>
      )}
      <p className="text-lg font-semibold">{title}</p>
      <p className="break-all text-sm text-heritage-muted">{hint}</p>
      <label
        htmlFor={inputId}
        className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-[#1d4d3c] px-6 text-sm font-semibold text-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-heritage-gold ${labelState}`}
      >
        <Upload className="size-4" aria-hidden="true" />
        {pickLabel}
      </label>
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
    </div>
  );
}
