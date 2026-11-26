import { compactButton, SectionCard } from "@/shared/ui/SectionCard";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Chip, formatDateTime } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord, RecordClaim } from "../model/handoverRecord.schema";
import { claimStatusLabel } from "../model/recordPresentation";
import { handoverRecordKeys } from "../model/useHandoverRecord";
import { RecordFileList } from "./RecordFileList";

type Decision = "ACCEPT" | "REJECT";

/** Một yêu cầu nhận: giấy tờ đã nộp, lời nhắn, kết quả xét và hai nút xét khi biên bản đang lập. */
function ClaimCard({ record, claim }: { record: HandoverRecord; claim: RecordClaim }) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [reason, setReason] = useState("");
  const status = claimStatusLabel[claim.status];
  const canReview = record.status === "DRAFTING";
  const review = (decision: Decision) =>
    void action.execute(
      () =>
        handoverRecordService.reviewClaim(
          record.id,
          claim.id,
          decision,
          reason.trim() || undefined,
        ),
      (next) => {
        client.setQueryData(handoverRecordKeys.verifier(next.id), next);
        void client.invalidateQueries({ queryKey: handoverRecordKeys.root });
        setReason("");
      },
    );
  const needsReason = reason.trim().length === 0;
  return (
    <article aria-label={`Yêu cầu của ${claim.fullName || "người nhận"}`} className="space-y-3 p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-heritage-primary">{claim.fullName || "Người nhận"}</h3>
          <p className="text-sm text-heritage-muted">
            CCCD {claim.citizenId} · gửi {formatDateTime(claim.createdAt)}
          </p>
        </div>
        <Chip tone={status.tone}>{status.label}</Chip>
      </header>
      {claim.note && <p className="whitespace-pre-line text-sm leading-6">“{claim.note}”</p>}
      <RecordFileList
        files={claim.files}
        download={(file, options) =>
          handoverRecordService.downloadFile(record.id, file.id, options)
        }
      />
      {claim.reviewReason && (
        <p className="text-sm">
          <span className="font-semibold">Lý do đã ghi: </span>
          {claim.reviewReason}
        </p>
      )}
      {canReview && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              aria-label="Lý do (bắt buộc khi từ chối)"
              placeholder="Ghi lý do (chỉ cần khi từ chối)"
              className="h-9 min-w-0 flex-1 basis-60 rounded-[10px] border border-heritage-border bg-white px-3 text-sm"
              maxLength={1000}
              value={reason}
              disabled={action.pending}
              onChange={(event) => setReason(event.target.value)}
            />
            <button
              type="button"
              className={compactButton.success}
              disabled={action.pending || claim.status === "ACCEPTED"}
              onClick={() => review("ACCEPT")}
            >
              Chấp nhận
            </button>
            <button
              type="button"
              className={compactButton.danger}
              disabled={action.pending || needsReason || claim.status === "REJECTED"}
              onClick={() => review("REJECT")}
            >
              Từ chối
            </button>
          </div>
          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * Giấy tờ người nhận nộp kèm yêu cầu nhận tài sản. Luật sư xem tệp (không xem nội dung tài sản), xác minh ở ngoài
 * hệ thống rồi chấp nhận hoặc từ chối có lý do. Người bị từ chối không được ghi vào biên bản.
 */
export function ClaimsReviewPanel({ record }: { record: HandoverRecord }) {
  return (
    <SectionCard title="A. Giấy tờ người nhận nộp" labelledBy="record-claims">
      {record.claims.length === 0 ? (
        <p className="p-5 text-sm text-heritage-muted">Chưa có yêu cầu nhận tài sản nào.</p>
      ) : (
        <div className="divide-y divide-heritage-border">
          {record.claims.map((claim) => (
            <ClaimCard key={claim.id} record={record} claim={claim} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
