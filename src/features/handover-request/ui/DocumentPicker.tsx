import { useId } from "react";
import { ACCEPT_ATTRIBUTE } from "../model/handoverRequest.schema";

/** Ô chọn nhiều tệp giấy tờ kèm danh sách tên đã chọn. */
export function DocumentPicker({
  files,
  onChange,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputId = useId();
  return (
    <div className="space-y-2 text-sm">
      <label htmlFor={inputId} className="block font-semibold">
        Tệp giấy tờ (PDF hoặc ảnh, tối đa 10 tệp, mỗi tệp 10 MB)
      </label>
      <input
        id={inputId}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        disabled={disabled}
        className="block w-full text-sm"
        onChange={(event) => onChange(Array.from(event.target.files ?? []))}
      />
      {files.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-heritage-muted">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}`} className="break-all">
              {file.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
