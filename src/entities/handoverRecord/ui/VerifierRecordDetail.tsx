import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { useVerifierRecord } from "../model/useHandoverRecord";
import { ClaimsReviewPanel } from "./ClaimsReviewPanel";
import { EvidencePanel } from "./EvidencePanel";
import { RecordLinesEditor } from "./RecordLinesEditor";
import { RecordReportsPanel } from "./RecordReportsPanel";
import { RecordStepper } from "./RecordStepper";
import { VerifierSigningPanel } from "./VerifierSigningPanel";

/** Chi tiết một biên bản của luật sư: thanh hai bước, việc của bước hiện tại, rồi nội dung biên bản. */
export function VerifierRecordDetail({
  recordId,
  onBack,
}: {
  recordId: string;
  onBack: () => void;
}) {
  const query = useVerifierRecord(recordId);
  if (query.isPending) return <p role="status">Đang tải biên bản…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không tải được biên bản hoặc biên bản không được giao cho bạn.</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonStyles.outline}
            onClick={() => void query.refetch()}
          >
            Thử lại
          </button>
          <button type="button" className={buttonStyles.outline} onClick={onBack}>
            Về danh sách
          </button>
        </div>
      </div>
    );
  }
  const record = query.data;
  return (
    <div className="space-y-6">
      <button type="button" className={buttonStyles.outline} onClick={onBack}>
        Về danh sách
      </button>
      <RecordStepper status={record.status} />
      {record.status === "CANCELLED" && (
        <Notice tone="neutral" title="Biên bản này đã hủy">
          {record.cancelReason ? `Lý do: ${record.cancelReason}. ` : ""}
          Biên bản này không còn hiệu lực. Kho đã mở khóa cho Chủ tài sản.
        </Notice>
      )}
      {record.status === "DRAFTING" && (
        <RecordLinesEditor
          key={`${record.id}-${record.revisionNo}`}
          record={record}
          before={
            <>
              <RecordReportsPanel record={record} />
              {(record.claims.length > 0 || record.reports.length === 0) && (
                <ClaimsReviewPanel record={record} />
              )}
            </>
          }
          after={<EvidencePanel record={record} />}
        />
      )}
      {record.status === "COMPLETED" && (
        <Notice tone="success" title="Mọi người nhận đã ký">
          Từng người nhận đã được mở quyền tải phần của mình; Người thực thi gửi mã nhận cho từng
          người.
        </Notice>
      )}
      {record.status !== "DRAFTING" && <VerifierSigningPanel record={record} />}
      {record.status !== "DRAFTING" && record.status !== "CANCELLED" && (
        <EvidencePanel record={record} />
      )}
    </div>
  );
}
