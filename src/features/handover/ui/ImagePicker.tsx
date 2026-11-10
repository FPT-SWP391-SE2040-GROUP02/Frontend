import type { ChangeEvent } from "react";
import { FileImage } from "lucide-react";

/** Ô chọn một ảnh căn cước (JPEG, PNG hoặc WEBP, tối đa 8 MiB). Chỉ chọn tệp ở máy; việc gửi do bước ký đảm nhiệm. */
export function ImagePicker({
  label,
  file,
  onPick,
}: {
  label: string;
  file: File | null;
  onPick: (file: File | null) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-heritage-border bg-white p-4 text-sm hover:bg-[#F7F4EA]">
      <span className="font-semibold text-heritage-primary">{label}</span>
      <span className="flex items-center gap-2 text-heritage-muted">
        <FileImage className="size-5 shrink-0" aria-hidden="true" />
        {file ? file.name : "Chưa chọn ảnh (JPEG, PNG hoặc WEBP, tối đa 8 MiB)"}
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label={label}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onPick(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}
