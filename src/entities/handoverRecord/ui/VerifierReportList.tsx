import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Chip, formatDateTime, Notice, Panel } from "@/shared/ui/heritageKit";
import { verifierReportService } from "../api/verifierReportService";
import type { VerifierReport } from "../model/handoverReport.schema";
import { claimStatusLabel } from "../model/recordPresentation";
import { handoverRecordKeys, useVerifierReports } from "../model/useHandoverRecord";
import { ReportFiles, SuggestedRecipientList } from "./ReportDetails";

type Decision = "ACCEPT" | "REQUEST_SUPPLEMENT" | "REJECT";

/** Kết quả tìm kho theo số căn cước người mất. */
function vaultText(report: VerifierReport): string {
  if (!report.vaultFound) {
    return "Không có kho nào theo số căn cước này. Bạn chỉ yêu cầu bổ sung hoặc từ chối được.";
  }
  if (!report.nameMatches) {
    return `Có kho của ${report.ownerName}, số căn cước khớp.`;
  }
  return `Có kho của ${report.ownerName}, họ tên và số căn cước đều khớp.`;
}

/** Các cảnh báo buộc luật sư đối chiếu giấy chứng tử và ghi lý do trước khi chấp nhận. */
function reportWarnings(report: VerifierReport): string[] {
  const warnings: string[] = [];
  if (!report.vaultFound) return warnings;
  if (!report.nameMatches) warnings.push("Họ tên khai không khớp họ tên eKYC của Chủ kho.");
  return warnings;
}

function ReportCard({
  report,
  onOpenRecord,
}: {
  report: VerifierReport;
  onOpenRecord: (recordId: string) => void;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const warnings = reportWarnings(report);
  const status = claimStatusLabel[report.status];
  const canReview = report.status === "SUBMITTED" || report.status === "SUPPLEMENT_REQUESTED";
  const needsReason = reason.trim().length === 0;
  const review = (decision: Decision) =>
    void action.execute(
      () =>
        verifierReportService.review(report.id, decision, reason.trim() || undefined, confirmed),
      (next) => {
        void client.invalidateQueries({ queryKey: handoverRecordKeys.root });
        if (decision === "ACCEPT" && next.recordId) onOpenRecord(next.recordId);
      },
    );
  return (
    <article
      aria-label={`Hồ sơ báo tin ${report.deceasedFullName}`}
      className="space-y-4 rounded-2xl border border-heritage-border bg-white/70 p-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-heritage-primary">
            Người mất: {report.deceasedFullName}
          </h3>
          <p className="text-sm text-heritage-muted">
            CCCD {report.deceasedCitizenId} · nộp {formatDateTime(report.createdAt)}
          </p>
        </div>
        <Chip tone={status.tone}>{status.label}</Chip>
      </header>
      <p className="text-sm leading-6">{vaultText(report)}</p>
      {warnings.length > 0 && (
        <Notice tone="warning" title="Cần đối chiếu kỹ">
          <ul className="list-disc space-y-1 pl-4">
            {warnings.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </Notice>
      )}
      <p className="break-words text-sm leading-6">
        <span className="font-semibold">Người nộp: </span>
        {[report.submitterName, report.submitterEmail, report.submitterPhone]
          .filter((text) => text !== "")
          .join(" · ")}
      </p>
      {report.note && <p className="whitespace-pre-line text-sm leading-6">“{report.note}”</p>}
      <SuggestedRecipientList recipients={report.recipients} />
      <ReportFiles
        files={report.files}
        download={(file, options) =>
          verifierReportService.downloadFile(report.id, file.id, options)
        }
      />
      {report.reviewReason && (
        <p className="text-sm">
          <span className="font-semibold">Lý do đã ghi: </span>
          {report.reviewReason}
        </p>
      )}
      {canReview && (
        <div className="space-y-3 border-t border-heritage-border pt-4">
          <label className="block space-y-1 text-sm font-semibold">
            {warnings.length > 0
              ? "Lý do (bắt buộc với mọi kết quả vì hồ sơ có cảnh báo)"
              : "Lý do (bắt buộc khi yêu cầu bổ sung hoặc từ chối)"}
            <textarea
              className="min-h-20 w-full rounded-xl border border-heritage-border bg-white p-3 font-normal"
              maxLength={1000}
              value={reason}
              disabled={action.pending}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          {warnings.length > 0 && (
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                className="mt-1 size-5 shrink-0 cursor-pointer accent-heritage-primary"
                checked={confirmed}
                disabled={action.pending}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              <span>Tôi đã đối chiếu giấy chứng tử và xác nhận đúng người.</span>
            </label>
          )}
          <p className="text-sm text-heritage-muted">
            Chấp nhận thì kho bị khóa, Chủ kho được báo và biên bản bàn giao được mở.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonStyles.dark}
              disabled={
                action.pending ||
                !report.vaultFound ||
                (warnings.length > 0 && (!confirmed || needsReason))
              }
              onClick={() => review("ACCEPT")}
            >
              Chấp nhận và mở biên bản
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
              disabled={action.pending || needsReason}
              onClick={() => review("REJECT")}
            >
              Từ chối
            </button>
          </div>
        </div>
      )}
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
    </article>
  );
}

/** Hồ sơ báo tin còn chờ xét được giao cho luật sư; không có thì không chiếm chỗ. */
export function VerifierReportList({ onOpenRecord }: { onOpenRecord: (recordId: string) => void }) {
  const query = useVerifierReports();
  if (query.isPending) return null;
  if (query.isError)
    return (
      <div role="alert" className="space-y-3 rounded-2xl bg-heritage-danger-bg p-5">
        <p className="text-sm text-heritage-danger">Không tải được hồ sơ báo tin.</p>
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Thử lại
        </button>
      </div>
    );
  const items = query.data.filter(
    (report) => report.status === "SUBMITTED" || report.status === "SUPPLEMENT_REQUESTED",
  );
  if (items.length === 0) return null;
  return (
    <Panel title="Hồ sơ báo tin chờ xét" labelledBy="verifier-reports">
      <div className="space-y-4">
        {items.map((report) => (
          <ReportCard key={report.id} report={report} onOpenRecord={onOpenRecord} />
        ))}
      </div>
    </Panel>
  );
}
