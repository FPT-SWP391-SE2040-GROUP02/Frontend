import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  claimStatusLabel,
  ReportFiles,
  SuggestedRecipientList,
  type MyReport,
} from "@/entities/handoverRecord";
import { buttonStyles, Chip, formatDateTime, Notice, Panel } from "@/shared/ui/heritageKit";
import { handoverReportService } from "../api/handoverReportService";
import { handoverRequestKeys, useMyReports } from "../model/useHandoverRequest";
import { ReportForm } from "./ReportForm";
import { SupplementForm } from "./SupplementForm";

/** Câu cho người nộp biết hồ sơ đang ở đâu. */
function reportText(report: MyReport): string {
  if (report.cancelledByOwner) return "Chủ kho đã hủy việc bàn giao.";
  switch (report.status) {
    case "SUBMITTED":
      return "Đã tiếp nhận. Luật sư đang kiểm giấy tờ.";
    case "SUPPLEMENT_REQUESTED":
      return "Luật sư cần thêm giấy tờ. Nộp bổ sung ở dưới.";
    case "ACCEPTED":
      return "Giấy tờ đã được chấp nhận. Luật sư lập biên bản và gửi thư cho từng người nhận.";
    case "REJECTED":
      return "Luật sư đã từ chối hồ sơ này.";
  }
}

function ReportCard({ report }: { report: MyReport }) {
  const client = useQueryClient();
  let status = claimStatusLabel[report.status];
  if (report.cancelledByOwner) status = { label: "Chủ kho đã hủy", tone: "neutral" };
  return (
    <article
      aria-label={`Hồ sơ báo tin ${report.deceasedFullName}`}
      className="space-y-3 rounded-2xl border border-heritage-border bg-white/70 p-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-heritage-primary">
            Hồ sơ của {report.deceasedFullName}
          </h3>
          <p className="text-sm text-heritage-muted">Nộp {formatDateTime(report.createdAt)}</p>
        </div>
        <Chip tone={status.tone}>{status.label}</Chip>
      </header>
      <p className="text-sm leading-6">{reportText(report)}</p>
      {report.reviewReason && (
        <p className="text-sm">
          <span className="font-semibold">Lý do của luật sư: </span>
          {report.reviewReason}
        </p>
      )}
      <SuggestedRecipientList recipients={report.recipients} />
      <ReportFiles
        files={report.files}
        download={(file) => handoverReportService.downloadFile(report.id, file.id)}
      />
      {report.status === "SUPPLEMENT_REQUESTED" && (
        <SupplementForm
          send={(note, files) => handoverReportService.supplement(report.id, note, files)}
          onSent={() => void client.invalidateQueries({ queryKey: handoverRequestKeys.reports })}
        />
      )}
    </article>
  );
}

/** Mục "Báo tin Chủ kho đã mất" ở trang Nhận tài sản: nộp hồ sơ và theo dõi các hồ sơ đã nộp. */
export function ReportPanel() {
  const client = useQueryClient();
  const query = useMyReports();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  return (
    <Panel title="Báo tin Chủ kho đã mất" labelledBy="handover-reports">
      <div className="space-y-5">
        {!open && (
          <div className="space-y-3 text-sm leading-6">
            <p className="text-heritage-muted">
              Dùng khi bạn chưa được khai làm người nhận. Nộp giấy chứng tử và di chúc; luật sư kiểm
              giấy tờ rồi xác định ai được nhận.
            </p>
            <button
              type="button"
              className={buttonStyles.dark}
              onClick={() => {
                setSent(false);
                setOpen(true);
              }}
            >
              Nộp hồ sơ
            </button>
          </div>
        )}
        {open && (
          <ReportForm
            onCancel={() => setOpen(false)}
            onSent={() => {
              setOpen(false);
              setSent(true);
              void client.invalidateQueries({ queryKey: handoverRequestKeys.reports });
            }}
          />
        )}
        {sent && (
          <Notice tone="success" title="Đã tiếp nhận hồ sơ" role="status">
            Luật sư sẽ kiểm giấy tờ. Bạn theo dõi kết quả ngay tại đây.
          </Notice>
        )}
        {query.isError && (
          <div role="alert" className="space-y-3 text-sm">
            <p>Không tải được các hồ sơ đã nộp.</p>
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Thử lại
            </button>
          </div>
        )}
        {query.isSuccess &&
          query.data.map((report) => <ReportCard key={report.id} report={report} />)}
      </div>
    </Panel>
  );
}
