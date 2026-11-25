import { formatDateTime, Panel } from "@/shared/ui/heritageKit";
import { verifierReportService } from "../api/verifierReportService";
import type { HandoverRecord } from "../model/handoverRecord.schema";
import { ReportFiles, SuggestedRecipientList } from "./ReportDetails";

/** Hồ sơ báo tin đã chấp nhận của biên bản: người nộp, giấy tờ và người nhận họ khai. */
export function RecordReportsPanel({ record }: { record: HandoverRecord }) {
  if (record.reports.length === 0) return null;
  return (
    <Panel title="Hồ sơ báo tin" labelledBy="record-reports">
      <div className="space-y-4">
        {record.reports.map((report) => (
          <article
            key={report.id}
            aria-label={`Hồ sơ của ${report.submitterName}`}
            className="space-y-4 rounded-2xl border border-heritage-border bg-white/70 p-5"
          >
            <header>
              <h3 className="font-semibold text-heritage-primary">{report.submitterName}</h3>
              <p className="text-sm text-heritage-muted">Nộp {formatDateTime(report.createdAt)}</p>
            </header>
            {report.note && (
              <p className="whitespace-pre-line text-sm leading-6">“{report.note}”</p>
            )}
            <SuggestedRecipientList recipients={report.recipients} />
            <ReportFiles
              files={report.files}
              download={(file, options) =>
                verifierReportService.downloadFile(report.id, file.id, options)
              }
            />
          </article>
        ))}
      </div>
    </Panel>
  );
}
