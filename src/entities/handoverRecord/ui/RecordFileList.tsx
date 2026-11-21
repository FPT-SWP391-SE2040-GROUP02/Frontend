import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { saveBlob } from "@/shared/lib/saveBlob";
import { buttonStyles, formatDateTime } from "@/shared/ui/heritageKit";
import type { RecordFile } from "../model/handoverRecord.schema";
import { fileSizeText } from "../model/recordPresentation";

/**
 * Danh sách tệp đính kèm: tên, dung lượng, ngày nộp và nút Tải về. download do nơi dùng truyền vào (API của luật sư
 * hoặc của người nhận); onRemove có thì hiện nút Gỡ.
 */
export function RecordFileList({
  files,
  download,
  onRemove,
  removing = false,
  emptyText = "Chưa có tệp nào.",
}: {
  files: RecordFile[];
  download: (file: RecordFile) => Promise<Blob>;
  onRemove?: (file: RecordFile) => void;
  removing?: boolean;
  emptyText?: string;
}) {
  const action = usePrivateAction();
  if (files.length === 0) return <p className="text-sm text-heritage-muted">{emptyText}</p>;
  return (
    <div className="space-y-2">
      <ul className="divide-y divide-heritage-border rounded-xl border border-heritage-border bg-white">
        {files.map((file) => (
          <li
            key={file.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
          >
            <div className="min-w-0">
              <p className="break-all font-medium">{file.fileName}</p>
              <p className="text-heritage-muted">
                {fileSizeText(file.sizeBytes)} · {formatDateTime(file.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={buttonStyles.outline}
                disabled={action.pending}
                aria-label={`Tải về ${file.fileName}`}
                onClick={() =>
                  void action.execute(
                    () => download(file),
                    (blob) => saveBlob(blob, file.fileName),
                  )
                }
              >
                Tải về
              </button>
              {onRemove && (
                <button
                  type="button"
                  className={buttonStyles.outline}
                  disabled={removing}
                  aria-label={`Gỡ ${file.fileName}`}
                  onClick={() => onRemove(file)}
                >
                  Gỡ
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
    </div>
  );
}
