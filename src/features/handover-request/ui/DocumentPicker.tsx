import { useId, useRef, useState } from "react";
import {
  ACCEPT_ATTRIBUTE,
  fileProblem,
  MAX_FILES,
  TOO_MANY_FILES_MESSAGE,
} from "../model/handoverRequest.schema";
import { FileDropZone, type Arrival } from "./FileDropZone";
import { FilePreviewDialog } from "./FilePreviewDialog";
import { PickedFileCard } from "./PickedFileCard";
import "./documentPicker.css";

/** Khóa nhận diện một tệp trong danh sách (tên + dung lượng + thời điểm sửa). */
function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/** Tách phần ghi chú trong ngoặc ở cuối nhãn, ví dụ "(bắt buộc)", để in nhạt hơn. */
function splitLabel(label: string): [string, string] {
  const match = /^(.*?)\s*(\([^()]*\))$/.exec(label);
  if (!match) return [label, ""];
  return [match[1], match[2]];
}

/**
 * Ô chọn hoặc kéo thả nhiều tệp giấy tờ. Mỗi lần chọn thêm tệp vào danh sách (bỏ tệp trùng), tệp quá cỡ, sai loại
 * hoặc vượt tổng số bị chặn ngay. `reserved` là số tệp đã chọn ở các ô khác trong cùng lần nộp.
 * Việc bắt buộc đính kèm do feature gọi nó kiểm.
 */
export function DocumentPicker({
  files,
  onChange,
  disabled,
  label = "Tệp giấy tờ",
  reserved = 0,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
  reserved?: number;
}) {
  const inputId = useId();
  const [problems, setProblems] = useState<string[]>([]);
  const [arrival, setArrival] = useState<Arrival | null>(null);
  const [preview, setPreview] = useState<File | null>(null);
  const arrivals = useRef(0);
  const [title, hint] = splitLabel(label);

  const add = (picked: File[]) => {
    if (disabled || picked.length === 0) return;
    const known = new Set(files.map(fileKey));
    const added: File[] = [];
    const rejected: string[] = [];
    for (const file of picked) {
      if (known.has(fileKey(file))) continue;
      const problem = fileProblem(file);
      if (problem) {
        rejected.push(problem);
      } else if (reserved + files.length + added.length >= MAX_FILES) {
        rejected.push(TOO_MANY_FILES_MESSAGE);
        break;
      } else {
        known.add(fileKey(file));
        added.push(file);
      }
    }
    setProblems(rejected);
    if (added.length === 0) return;
    arrivals.current += 1;
    setArrival({ id: arrivals.current, files: added });
    onChange([...files, ...added]);
  };

  const remove = (target: File) => {
    setProblems([]);
    setArrival(null);
    onChange(files.filter((file) => fileKey(file) !== fileKey(target)));
  };

  let count = "Chưa có tệp";
  let countStyle = "bg-heritage-sunken text-heritage-muted";
  if (files.length > 0) {
    count = `${files.length} tệp`;
    countStyle = "bg-heritage-success-bg text-heritage-success";
  }

  return (
    <div className="space-y-2.5 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-heritage-primary">
          {title}
          {hint && <span className="font-normal text-heritage-muted"> {hint}</span>}
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${countStyle}`}>
          {count}
        </span>
      </div>
      <FileDropZone
        inputId={inputId}
        inputLabel={`${label} (PDF hoặc ảnh, tối đa 10 tệp, mỗi tệp 10 MB)`}
        accept={ACCEPT_ATTRIBUTE}
        hasFiles={files.length > 0}
        disabled={disabled}
        arrival={arrival}
        onArrivalEnd={() => setArrival(null)}
        onFiles={add}
      />
      {problems.length > 0 && (
        <ul role="alert" className="text-destructive">
          {problems.map((problem, index) => (
            <li key={`${index}-${problem}`}>{problem}</li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(17rem,100%),1fr))] gap-2.5">
          {files.map((file) => (
            <PickedFileCard
              key={fileKey(file)}
              file={file}
              fresh={arrival?.files.includes(file) ?? false}
              disabled={disabled}
              onPreview={() => setPreview(file)}
              onRemove={() => remove(file)}
            />
          ))}
        </ul>
      )}
      <FilePreviewDialog file={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
