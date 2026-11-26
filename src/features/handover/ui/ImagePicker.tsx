import { useEffect, useState, type ChangeEvent } from "react";
import { Check, Upload } from "lucide-react";

/** Ô chọn một ảnh căn cước (JPEG, PNG hoặc WEBP, tối đa 8 MiB). Hiện ảnh đã tải lên để người nhận đối chiếu trước khi ký. */
export function ImagePicker({
  label,
  file,
  onPick,
}: {
  label: string;
  file: File | null;
  onPick: (file: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    if (picked && typeof URL.createObjectURL === "function") {
      setPreviewUrl(URL.createObjectURL(picked));
    } else {
      setPreviewUrl(null);
    }
    onPick(picked);
  };

  const activePreview = file ? previewUrl : null;

  return (
    <label
      className={`group flex cursor-pointer flex-col items-center gap-2 rounded-[14px] border-2 p-5 text-center text-sm transition-colors hover:border-heritage-gold ${file ? "border-solid border-heritage-success bg-heritage-success-bg" : "border-dashed border-heritage-gold-soft bg-heritage-warning-bg"}`}
    >
      <span className="font-semibold text-heritage-primary">{label}</span>
      {activePreview && (
        <div className="pm-pop overflow-hidden rounded-lg border border-heritage-border bg-heritage-canvas p-1.5">
          <img
            src={activePreview}
            alt={`Ảnh đối chiếu ${label}`}
            className="h-40 w-full rounded object-contain"
          />
        </div>
      )}
      {/* Chỉ hiện biểu tượng, không chữ hướng dẫn: chưa chọn thì dấu tải lên, đã chọn thì dấu tích. Tên tệp và định dạng
          cho trình đọc màn hình. */}
      {file ? (
        <Check
          className="pm-pop pm-check size-7 shrink-0 text-heritage-success"
          aria-hidden="true"
        />
      ) : (
        <Upload className="pm-bob size-8 shrink-0 text-heritage-gold-hover" aria-hidden="true" />
      )}
      <span className="sr-only">
        {file
          ? `Đã chọn ${file.name}. Bấm để đổi ảnh.`
          : "Bấm để chọn ảnh JPEG, PNG hoặc WEBP, tối đa 8 MiB."}
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label={label}
        onChange={handleChange}
      />
    </label>
  );
}
