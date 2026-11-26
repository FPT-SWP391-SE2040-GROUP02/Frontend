import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import {
  claimStatusLabel,
  ReportFiles,
  SuggestedRecipientList,
  type MyReport,
} from "@/entities/handoverRecord";
import { buttonStyles, Chip, formatDateTime, Notice } from "@/shared/ui/heritageKit";
import { handoverReportService } from "../api/handoverReportService";
import { handoverRequestKeys, useMyReports } from "../model/useHandoverRequest";
import { ReportForm } from "./ReportForm";
import { SupplementForm } from "./SupplementForm";

/** Câu cho người nộp biết hồ sơ đang ở đâu. */
function reportText(report: MyReport): string {
  if (report.cancelReason) return `Luật sư đã hủy việc bàn giao. Lý do: ${report.cancelReason}`;
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
  if (report.cancelReason) status = { label: "Luật sư đã hủy", tone: "neutral" };
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
        download={(file, options) =>
          handoverReportService.downloadFile(report.id, file.id, options)
        }
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

/** Hai vùng của mục báo tin để trang xếp vào hai cột: lối vào, và phần đang điền hoặc đang theo dõi. */
export interface ReportPanelParts {
  entry: ReactNode;
  /** null khi chưa mở form, chưa nộp hồ sơ nào và không có lỗi tải. */
  activity: ReactNode;
}

function stacked({ entry, activity }: ReportPanelParts): ReactNode {
  return (
    <div className="space-y-6">
      {entry}
      {activity}
    </div>
  );
}

/**
 * Mục "Báo tin Chủ tài sản đã mất" ở trang Nhận tài sản: nộp hồ sơ và theo dõi các hồ sơ đã nộp. Đây là luồng ngoại lệ
 * nên lối vào có nền ngả vàng và nút viền, không tranh chỗ với nút chính của danh sách kho.
 */
export function ReportPanel({
  layout = stacked,
}: {
  layout?: (parts: ReportPanelParts) => ReactNode;
}) {
  const client = useQueryClient();
  const query = useMyReports();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Form hiện ở cột chính, có thể nằm ngoài màn hình so với nút vừa bấm: cuộn tới.
  useEffect(() => {
    if (!open || formRef.current === null) {
      return;
    }
    if (typeof formRef.current.scrollIntoView !== "function") {
      return;
    }
    let behavior: ScrollBehavior = "smooth";
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      behavior = "auto";
    }
    formRef.current.scrollIntoView({ behavior, block: "nearest" });
  }, [open]);

  const entry = (
    <section
      aria-labelledby="handover-reports"
      className="space-y-3 rounded-2xl border border-heritage-gold-border bg-heritage-gold-light p-5"
    >
      <h2
        id="handover-reports"
        className="flex items-center gap-2.5 text-lg font-semibold text-heritage-primary"
      >
        <FileText className="size-5 shrink-0 text-heritage-gold-hover" aria-hidden="true" />
        Báo tin Chủ tài sản đã mất
      </h2>
      <p className="text-sm leading-6 text-heritage-muted">
        Dùng khi bạn chưa được khai làm người nhận. Nộp giấy chứng tử và di chúc; luật sư kiểm giấy
        tờ rồi xác định ai được nhận.
      </p>
      {!open && (
        <button
          type="button"
          className={`${buttonStyles.outline} receive-press w-full border-heritage-gold-hover`}
          onClick={() => {
            setSent(false);
            setOpen(true);
          }}
        >
          Nộp hồ sơ
        </button>
      )}
      {open && <p className="text-sm font-semibold text-heritage-primary">Bạn đang điền hồ sơ.</p>}
    </section>
  );

  let activity: ReactNode = null;
  const hasReports = query.isSuccess && query.data.length > 0;
  if (open || sent || query.isError || hasReports) {
    activity = (
      <section aria-label="Hồ sơ báo tin của bạn" className="space-y-4">
        <h2 className="text-lg font-semibold text-heritage-primary">Hồ sơ báo tin của bạn</h2>
        {open && (
          <div
            ref={formRef}
            className="receive-rise rounded-2xl border border-heritage-border bg-heritage-surface p-5 shadow-sm sm:p-6"
          >
            <ReportForm
              onCancel={() => setOpen(false)}
              onSent={() => {
                setOpen(false);
                setSent(true);
                void client.invalidateQueries({ queryKey: handoverRequestKeys.reports });
              }}
            />
          </div>
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
      </section>
    );
  }

  return <>{layout({ entry, activity })}</>;
}
