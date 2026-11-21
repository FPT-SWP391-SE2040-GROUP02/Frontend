import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/shared/config/routes.config";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Notice, Panel } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord, RecordRecipient } from "../model/handoverRecord.schema";
import { handoverRecordKeys, useVerifierRecord } from "../model/useHandoverRecord";
import { RecordDocument } from "./RecordDocument";
import { RecordLinesEditor } from "./RecordLinesEditor";
import { RecordStepper } from "./RecordStepper";

/** Nút mở hồ sơ danh tính của một người nhận ở trang Danh tính người nhận. */
function IdentityAction({ recipient }: { recipient: RecordRecipient }) {
  if (!recipient.submissionId || recipient.identityConfirmedAt) return null;
  return (
    <Link
      className={buttonStyles.outline}
      to={`${ROUTES.NOTARY.RECIPIENTS}?submissionId=${recipient.submissionId}`}
    >
      Kiểm danh tính
    </Link>
  );
}

/** Bước 2 và 3: kiểm danh tính, ký, hoặc mở lại biên bản để sửa. */
function FinalizedActions({ record }: { record: HandoverRecord }) {
  const client = useQueryClient();
  const sign = usePrivateAction();
  const reopen = usePrivateAction();
  const busy = sign.pending || reopen.pending;
  const apply = (next: HandoverRecord) => {
    client.setQueryData(handoverRecordKeys.verifier(next.id), next);
    void client.invalidateQueries({ queryKey: handoverRecordKeys.root });
  };
  const waiting = record.recipients.filter((recipient) => !recipient.identityConfirmedAt).length;
  return (
    <Panel
      title={
        record.status === "IDENTITY_CHECK"
          ? "Bước 2 · Danh tính người nhận"
          : "Bước 3 · Chữ ký ba bên"
      }
      labelledBy="record-actions"
    >
      <div className="space-y-4 text-sm leading-6">
        {record.status === "IDENTITY_CHECK" && (
          <p>
            {`Còn ${waiting} người nhận chưa được xác nhận danh tính. Bấm "Kiểm danh tính" ở từng dòng khi người nhận đã nộp căn cước. Đủ người thì biên bản sang bước ký.`}
          </p>
        )}
        {record.status === "SIGNING" && (
          <p>
            Mọi người nhận đã được xác nhận danh tính. Bạn, Người thực thi và từng người nhận cùng
            ký. Đủ chữ ký thì người nhận được mở quyền tải và Người thực thi gửi mã nhận.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {record.status === "SIGNING" && (
            <button
              type="button"
              className={buttonStyles.dark}
              disabled={busy || !record.canSign}
              onClick={() =>
                void sign.execute(() => handoverRecordService.signAsVerifier(record.id), apply)
              }
            >
              {record.canSign ? (sign.pending ? "Đang ký…" : "Ký xác minh") : "Bạn đã ký"}
            </button>
          )}
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={busy}
            onClick={() =>
              void reopen.execute(() => handoverRecordService.reopen(record.id), apply)
            }
          >
            {reopen.pending ? "Đang mở lại…" : "Mở lại biên bản để sửa"}
          </button>
        </div>
        <p className="text-heritage-muted">
          Mở lại biên bản thì mọi chữ ký đã có mất hiệu lực, cả ba bên phải ký lại. Người nhận đã
          được xác nhận danh tính vẫn giữ nguyên.
        </p>
        {(sign.error || reopen.error) && (
          <p role="alert" className="text-destructive">
            {sign.error || reopen.error}
          </p>
        )}
      </div>
    </Panel>
  );
}

/** Chi tiết một biên bản của luật sư: thanh ba bước, việc của bước hiện tại, rồi nội dung biên bản. */
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
      {record.status === "DRAFTING" && (
        <RecordLinesEditor key={`${record.id}-${record.revisionNo}`} record={record} />
      )}
      {(record.status === "IDENTITY_CHECK" || record.status === "SIGNING") && (
        <FinalizedActions record={record} />
      )}
      {record.status === "COMPLETED" && (
        <Notice tone="success" title="Biên bản đã đủ chữ ký ba bên">
          Người nhận đã được mở quyền tải. Người thực thi gửi mã nhận cho từng người.
        </Notice>
      )}
      <RecordDocument
        record={record}
        renderRecipientAction={
          record.status === "IDENTITY_CHECK"
            ? (recipient) => <IdentityAction recipient={recipient} />
            : undefined
        }
      />
    </div>
  );
}
