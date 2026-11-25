import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Panel } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord } from "../model/handoverRecord.schema";
import { handoverRecordKeys } from "../model/useHandoverRecord";
import { RecordFileList } from "./RecordFileList";

/** Tệp căn cứ luật sư đính kèm biên bản (di chúc, văn bản phân chia, bản án...). Chỉ thêm, gỡ khi biên bản đang lập. */
export function EvidencePanel({ record }: { record: HandoverRecord }) {
  const client = useQueryClient();
  const upload = usePrivateAction();
  const remove = usePrivateAction();
  const input = useRef<HTMLInputElement>(null);
  const editable = record.status === "DRAFTING";
  const apply = (next: HandoverRecord) =>
    client.setQueryData(handoverRecordKeys.verifier(next.id), next);
  return (
    <Panel title="Tệp căn cứ của biên bản" labelledBy="record-evidence">
      <div className="space-y-4 text-sm">
        <RecordFileList
          files={record.evidenceFiles}
          emptyText="Chưa đính kèm tệp căn cứ nào."
          download={(file, options) =>
            handoverRecordService.downloadFile(record.id, file.id, options)
          }
          removing={remove.pending}
          onRemove={
            editable
              ? (file) =>
                  void remove.execute(
                    () => handoverRecordService.removeEvidence(record.id, file.id),
                    apply,
                  )
              : undefined
          }
        />
        {editable && (
          <label className="block space-y-2">
            <span className="font-semibold">
              Đính kèm tệp (PDF hoặc ảnh, tối đa 10 tệp, mỗi tệp 10 MB)
            </span>
            <input
              ref={input}
              type="file"
              multiple
              accept="application/pdf,image/jpeg,image/png,image/webp"
              disabled={upload.pending}
              className="block w-full text-sm"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length === 0) return;
                void upload.execute(
                  () => handoverRecordService.addEvidence(record.id, files),
                  (next) => {
                    apply(next);
                    if (input.current) input.current.value = "";
                  },
                );
              }}
            />
          </label>
        )}
        {upload.pending && <p role="status">Đang tải tệp lên…</p>}
        {(upload.error || remove.error) && (
          <p role="alert" className="text-destructive">
            {upload.error || remove.error}
          </p>
        )}
        <p className="text-heritage-muted">
          Hệ thống chỉ lưu tệp, không kiểm nội dung. Việc xác minh pháp lý làm ở ngoài hệ thống.
        </p>
      </div>
    </Panel>
  );
}
