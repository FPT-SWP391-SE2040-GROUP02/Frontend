import { SectionCard } from "@/shared/ui/SectionCard";
import { formatDateTime } from "@/shared/ui/heritageKit";
import { verifierReportService } from "../api/verifierReportService";
import type { HandoverRecord } from "../model/handoverRecord.schema";
import { DocumentFiles, SuggestedRecipientList } from "./ReportDetails";

/**
 * Hồ sơ báo tin đã chấp nhận của biên bản: người nộp, giấy tờ và người nhận họ khai.
 * Mặc định thu gọn để trang không quá dài; bấm mũi tên ở đầu mục để mở hoặc thu lại.
 */
export function RecordReportsPanel({ record }: { record: HandoverRecord }) {
  if (record.reports.length === 0) return null;
  const submitters = record.reports.map((report) => report.submitterName).join(", ");
  return (
    <SectionCard
      title="A. Hồ sơ báo tin"
      subtitle={`Người nộp: ${submitters}`}
      labelledBy="record-reports"
      collapsible
      defaultOpen={false}
    >
      <div className="divide-y divide-heritage-border">
        {record.reports.map((report) => (
          <article
            key={report.id}
            aria-label={`Hồ sơ của ${report.submitterName}`}
            className="space-y-3 p-5"
          >
            <header>
              <h3 className="font-semibold text-heritage-primary">{report.submitterName}</h3>
              <p className="text-sm text-heritage-muted">Nộp {formatDateTime(report.createdAt)}</p>
            </header>
            {report.note && (
              <p className="whitespace-pre-line text-sm leading-6">“{report.note}”</p>
            )}
            <SuggestedRecipientList recipients={report.recipients} />
            <DocumentFiles
              files={report.files}
              download={(file, options) =>
                verifierReportService.downloadFile(report.id, file.id, options)
              }
            />
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
