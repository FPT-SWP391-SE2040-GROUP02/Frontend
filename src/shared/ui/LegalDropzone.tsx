import { useRef, type ReactNode } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "./button";
/** @description Cấu hình vùng chọn tệp; kiểm tra/upload thuộc feature gọi nó. */
export interface LegalDropzoneProps {
  title?: string;
  subtitle?: string;
  sealLabel?: string;
  onFileSelect?: (file: File) => void;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}
/** @description Chọn bằng bàn phím hoặc kéo thả qua cùng callback có guard disabled. */
export function LegalDropzone({
  title = "Chọn tài liệu pháp lý",
  subtitle = "PDF, JPG, PNG",
  sealLabel,
  onFileSelect,
  className = "",
  disabled = false,
  children,
}: LegalDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  /** @description Chỉ chuyển file cho feature khi vùng chọn được bật. */
  const selectFile = (file?: File): void => {
    if (file && !disabled) onFileSelect?.(file);
  };
  return (
    <div
      className={`dropzone-box text-center ${className}`}
      aria-disabled={disabled}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        selectFile(event.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        disabled={disabled}
        accept=".pdf,.jpg,.jpeg,.png"
        aria-label={title}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          selectFile(file);
        }}
      />
      {children ?? (
        <>
          <UploadCloud className="mx-auto" aria-hidden="true" />
          <p>{title}</p>
          <p>{subtitle}</p>
          {sealLabel && <p>{sealLabel}</p>}
        </>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {title}
      </Button>
    </div>
  );
}
