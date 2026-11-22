import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Chip, formatDateTime, Panel } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord, RecordClaim } from "../model/handoverRecord.schema";
import { claimStatusLabel } from "../model/recordPresentation";
import { handoverRecordKeys } from "../model/useHandoverRecord";
import { RecordFileList } from "./RecordFileList";

type Decision = "ACCEPT" | "REQUEST_SUPPLEMENT" | "REJECT";

/** Một yêu cầu nhận: giấy tờ đã nộp, lời nhắn, kết quả xét và ba nút xét khi biên bản đang lập. */
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
    <article
      aria-label={`Yêu cầu của ${claim.fullName || "người nhận"}`}
      className="space-y-4 rounded-2xl border border-heritage-border bg-white/70 p-5"
    >
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
        download={(file) => handoverRecordService.downloadFile(record.id, file.id)}
      />
      {claim.reviewReason && (
        <p className="text-sm">
          <span className="font-semibold">Lý do đã ghi: </span>
          {claim.reviewReason}
        </p>
      )}
      {canReview && (
        <div className="space-y-3 border-t border-heritage-border pt-4">
          <label className="block space-y-1 text-sm font-semibold">
            Lý do (bắt buộc khi yêu cầu bổ sung hoặc từ chối)
            <textarea
              className="min-h-20 w-full rounded-xl border border-heritage-border bg-white p-3 font-normal"
              maxLength={1000}
              value={reason}
              disabled={action.pending}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonStyles.dark}
              disabled={action.pending || claim.status === "ACCEPTED"}
              onClick={() => review("ACCEPT")}
            >
              Chấp nhận
            </button>
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={action.pending || needsReason}
              onClick={() => review("REQUEST_SUPPLEMENT")}
            >
              Yêu cầu bổ sung
            </button>
            <button
              type="button"
              className={buttonStyles.outline}
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
 * hệ thống rồi chấp nhận, yêu cầu bổ sung hoặc từ chối có lý do. Người bị từ chối không được ghi vào biên bản.
 */
export function ClaimsReviewPanel({ record }: { record: HandoverRecord }) {
  return (
    <Panel title="Giấy tờ người nhận nộp" labelledBy="record-claims">
      {record.claims.length === 0 ? (
        <p className="text-sm text-heritage-muted">Chưa có yêu cầu nhận tài sản nào.</p>
      ) : (
        <div className="space-y-4">
          {record.claims.map((claim) => (
            <ClaimCard key={claim.id} record={record} claim={claim} />
          ))}
        </div>
      )}
    </Panel>
  );
}
