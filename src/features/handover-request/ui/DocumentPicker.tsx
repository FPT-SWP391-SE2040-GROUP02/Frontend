import { useId, type ChangeEvent } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { ACCEPT_ATTRIBUTE } from "../model/handoverRequest.schema";

/** Khóa nhận diện một tệp trong danh sách (tên + dung lượng + thời điểm sửa). */
function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/**
 * Ô chọn nhiều tệp giấy tờ. Mỗi lần chọn thêm tệp vào danh sách (bỏ tệp trùng),
 * từng tệp bỏ được bằng nút X. Kiểm số lượng và dung lượng thuộc feature gọi nó.
 */
export function DocumentPicker({
  files,
  onChange,
  disabled,
  label = "Tệp giấy tờ",
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
}) {
  const inputId = useId();

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;
    const known = new Set(files.map(fileKey));
    const next = [...files];
    for (const file of picked) {
      if (!known.has(fileKey(file))) {
        known.add(fileKey(file));
        next.push(file);
      }
    }
    onChange(next);
  };

  const remove = (target: File) => {
    onChange(files.filter((file) => fileKey(file) !== fileKey(target)));
  };

  return (
    <div className="space-y-3 text-sm">
      <span className="block font-semibold text-heritage-primary">{label}</span>
      <label
        htmlFor={inputId}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-heritage-border-strong bg-white px-4 py-6 text-center hover:bg-heritage-sunken has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-heritage-gold-hover"
      >
        <UploadCloud className="size-6 text-heritage-primary" aria-hidden="true" />
        <span className="font-semibold text-heritage-primary">
          {files.length > 0 ? "Chọn thêm tệp" : "Chọn tệp giấy tờ"}
        </span>
        <span className="text-heritage-muted">PDF hoặc ảnh, tối đa 10 tệp, mỗi tệp 10 MB</span>
        <input
          id={inputId}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          disabled={disabled}
          aria-label={`${label} (PDF hoặc ảnh, tối đa 10 tệp, mỗi tệp 10 MB)`}
          className="sr-only"
          onChange={handlePick}
        />
      </label>
      {files.length > 0 && (
        <ul className="divide-y divide-heritage-border rounded-xl border border-heritage-border bg-white">
          {files.map((file) => (
            <li key={fileKey(file)} className="flex items-center gap-3 px-3 py-2.5">
              <FileText className="size-5 shrink-0 text-heritage-muted" aria-hidden="true" />
              <span className="w-0 min-w-0 flex-1 truncate" title={file.name}>
                {file.name}
              </span>
              <span className="shrink-0 text-heritage-muted">{formatStorageSize(file.size)}</span>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Bỏ tệp ${file.name}`}
                className="-my-2 -mr-1 inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-heritage-muted hover:bg-heritage-sunken hover:text-heritage-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold-hover disabled:pointer-events-none disabled:opacity-50"
                onClick={() => remove(file)}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
