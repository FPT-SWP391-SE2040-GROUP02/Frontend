import { useEffect, useState, type ChangeEvent } from "react";
import { FileImage } from "lucide-react";

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
    <label className="flex cursor-pointer flex-col gap-2.5 rounded-xl border border-dashed border-heritage-border bg-white p-4 text-sm hover:bg-[#F7F4EA]">
      <span className="font-semibold text-heritage-primary">{label}</span>
      {activePreview && (
        <div className="overflow-hidden rounded-lg border border-heritage-border bg-[#F9F7F1] p-1.5">
          <img
            src={activePreview}
            alt={`Ảnh đối chiếu ${label}`}
            className="h-40 w-full rounded object-contain"
          />
        </div>
      )}
      <span className="flex items-center gap-2 text-heritage-muted">
        <FileImage className="size-5 shrink-0" aria-hidden="true" />
        <span className="truncate">
          {file ? file.name : "Chưa chọn ảnh (JPEG, PNG hoặc WEBP, tối đa 8 MiB)"}
        </span>
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
