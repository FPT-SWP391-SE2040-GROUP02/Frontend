import { compactButton } from "@/shared/ui/SectionCard";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { saveBlob } from "@/shared/lib/saveBlob";
import { Chip, formatDateTime, type Tone } from "@/shared/ui/heritageKit";
import type { RecordFile } from "../model/handoverRecord.schema";
import { fileSizeText } from "../model/recordPresentation";
import { ActionButton } from "@/shared/ui/ActionButton";
import { useTransfer, type TransferOptions } from "@/shared/lib/useTransfer";
import { FilePreviewButton } from "./FilePreviewButton";

/** Nhãn cho biết loại giấy tờ người nhận đã nộp; tệp loại khác (căn cứ của luật sư) không gắn nhãn. */
const KIND_LABELS: Record<string, { text: string; tone: Tone }> = {
  DEATH_CERTIFICATE: { text: "Giấy chứng tử", tone: "warning" },
  WILL: { text: "Di chúc", tone: "warning" },
  OTHER: { text: "Giấy tờ khác", tone: "neutral" },
  CLAIM_DOCUMENT: { text: "Giấy tờ", tone: "neutral" },
};

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
  showWillLabel = true,
}: {
  files: RecordFile[];
  download: (file: RecordFile, options: TransferOptions) => Promise<Blob>;
  onRemove?: (file: RecordFile) => void;
  removing?: boolean;
  emptyText?: string;
  /** Tắt khi danh sách đã chia sẵn theo loại giấy tờ. */
  showWillLabel?: boolean;
}) {
  const action = usePrivateAction();
  const transfer = useTransfer();
  if (files.length === 0) return <p className="text-sm text-heritage-muted">{emptyText}</p>;
  return (
    <div className="space-y-2">
      <ul className="divide-y divide-heritage-border rounded-xl border border-heritage-border bg-white">
        {files.map((file) => (
          <li
            key={file.id}
            className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {showWillLabel && KIND_LABELS[file.kind] && (
                  <Chip tone={KIND_LABELS[file.kind].tone}>{KIND_LABELS[file.kind].text}</Chip>
                )}
                <span className="break-all">{file.fileName}</span>
              </p>
              <p className="text-heritage-muted">
                {fileSizeText(file.sizeBytes)} · {formatDateTime(file.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <FilePreviewButton file={file} download={() => download(file, {})} />
              <ActionButton
                className={compactButton.outline}
                disabled={action.pending}
                aria-label={`Tải về ${file.fileName}`}
                onClick={() =>
                  void action.execute(
                    transfer.track(file.id, (options) => download(file, options)),
                    (blob) => saveBlob(blob, file.fileName),
                  )
                }
                pending={action.pending && transfer.activeKey === file.id}
                done={transfer.done}
                progress={transfer.activeKey === file.id ? transfer.percent : null}
                onCancel={transfer.cancel}
                preparingLabel="Đang chuẩn bị…"
                pendingLabel="Đang tải"
                doneLabel="Đã tải xong"
              >
                Tải về
              </ActionButton>
              {onRemove && (
                <button
                  type="button"
                  className={compactButton.outline}
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
