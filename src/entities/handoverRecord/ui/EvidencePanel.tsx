import { compactButton, SectionCard } from "@/shared/ui/SectionCard";
import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
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
    <SectionCard
      title="C. Giấy tờ đính kèm thêm (nếu có)"
      subtitle="Tệp PDF hoặc ảnh, tối đa 10 tệp, mỗi tệp 10 MB."
      labelledBy="record-evidence"
      collapsible
      defaultOpen={false}
    >
      <div className="space-y-3 p-5 text-sm">
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
          <label className={`${compactButton.outline} w-fit focus-within:outline-2`}>
            Chọn tệp từ máy
            <input
              ref={input}
              type="file"
              multiple
              aria-label="Đính kèm tệp (PDF hoặc ảnh, tối đa 10 tệp, mỗi tệp 10 MB)"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              disabled={upload.pending}
              className="sr-only"
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
    </SectionCard>
  );
}
