import { Link } from "react-router-dom";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/shared/config/routes.config";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Notice, Panel } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord, RecordRecipient } from "../model/handoverRecord.schema";
import { isSigningStage } from "../model/recordPresentation";
import { handoverRecordKeys, useVerifierRecord } from "../model/useHandoverRecord";
import { ClaimsReviewPanel } from "./ClaimsReviewPanel";
import { EvidencePanel } from "./EvidencePanel";
import { RecordDocument } from "./RecordDocument";
import { RecordLinesEditor } from "./RecordLinesEditor";
import { RecordReportsPanel } from "./RecordReportsPanel";
import { RecordStepper } from "./RecordStepper";
import { RemindExecutorButton } from "./RemindExecutorButton";
import { ActionButton } from "@/shared/ui/ActionButton";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";

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

/** Lý do không mở lại được biên bản khi đã giao cho ít nhất một người nhận. */
const PARTIALLY_DELIVERED_TEXT =
  "Đã giao tài sản cho ít nhất một người nhận nên không mở lại được biên bản. Sai sót sau khi giao xử lý ngoài hệ thống.";

/** Bước 2: ký ngay sau khi chốt, kiểm danh tính từng người nhận, hoặc mở lại biên bản để sửa. */
function FinalizedActions({
  record,
  signPending,
}: {
  record: HandoverRecord;
  signPending: boolean;
}) {
  const client = useQueryClient();
  const reopen = usePrivateAction();
  const busy = signPending || reopen.pending;
  const apply = (next: HandoverRecord) => {
    client.setQueryData(handoverRecordKeys.verifier(next.id), next);
    void client.invalidateQueries({ queryKey: handoverRecordKeys.root });
  };
  const waiting = record.recipients.filter((recipient) => !recipient.identityConfirmedAt).length;
  // Đã giao cho ít nhất một người (lượt có quyền tải) thì Backend chặn mở lại (PARTIALLY_DELIVERED): ẩn nút.
  const delivered = record.recipients.some(
    (recipient) => recipient.turnStatus === "HANDOVER_COMMITTED",
  );
  return (
    <Panel title="Bước 2 · Ký và giao từng người" labelledBy="record-actions">
      <div className="space-y-4 text-sm leading-6">
        <p>
          Bạn và Người thực thi ký được ngay. Mỗi người nhận đi riêng: nộp căn cước, bạn xác nhận
          danh tính, rồi người đó ký. Có chữ ký của bạn, Người thực thi và một người nhận thì người
          đó được mở quyền tải, không chờ người nhận khác.
        </p>
        <p>Bấm "Xem và ký biên bản" ở bên dưới, đọc xong thì bấm nút ký ở ô chữ ký của luật sư.</p>
        <p>
          {`Còn ${waiting} người nhận chưa được xác nhận danh tính. Bấm "Kiểm danh tính" ở dòng của người đã nộp căn cước.`}
        </p>
        <div className="flex flex-wrap gap-2">
          {!delivered && (
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
          )}
        </div>
        {isSigningStage(record.status) && !record.executorSignedAt && (
          <RemindExecutorButton record={record} onUpdated={apply} />
        )}
        {delivered ? (
          <p role="note" className="text-heritage-muted">
            {PARTIALLY_DELIVERED_TEXT}
          </p>
        ) : (
          <p className="text-heritage-muted">
            Mở lại biên bản thì mọi chữ ký đã có mất hiệu lực, cả ba bên phải ký lại. Người nhận đã
            được xác nhận danh tính vẫn giữ nguyên.
          </p>
        )}
        {reopen.error && (
          <p role="alert" className="text-destructive">
            {reopen.error}
          </p>
        )}
      </div>
    </Panel>
  );
}

/** Hủy biên bản đang lập (mở nhầm, giấy tờ sai): bắt buộc lý do và bấm xác nhận lần hai. */
function CancelRecordPanel({ record }: { record: HandoverRecord }) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Panel title="Hủy biên bản" labelledBy="record-cancel">
      <div className="space-y-3 text-sm leading-6">
        <p className="text-heritage-muted">
          Dùng khi mở nhầm hoặc giấy tờ sai. Kho mở khóa; Chủ kho và Người thực thi được báo. Hủy
          rồi không khôi phục được.
        </p>
        {!open && (
          <button type="button" className={buttonStyles.outline} onClick={() => setOpen(true)}>
            Hủy biên bản
          </button>
        )}
        {open && (
          <>
            <label className="block space-y-1 font-semibold">
              Lý do hủy
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
                disabled={action.pending || reason.trim() === ""}
                onClick={() =>
                  void action.execute(
                    () => handoverRecordService.cancel(record.id, reason.trim()),
                    (next) => {
                      client.setQueryData(handoverRecordKeys.verifier(next.id), next);
                      void client.invalidateQueries({ queryKey: handoverRecordKeys.root });
                    },
                  )
                }
              >
                {action.pending ? "Đang hủy…" : "Đồng ý hủy"}
              </button>
              <button
                type="button"
                className={buttonStyles.outline}
                disabled={action.pending}
                onClick={() => setOpen(false)}
              >
                Giữ biên bản
              </button>
            </div>
          </>
        )}
        {action.error && (
          <p role="alert" className="text-destructive">
            {action.error}
          </p>
        )}
      </div>
    </Panel>
  );
}

/** Chi tiết một biên bản của luật sư: thanh hai bước, việc của bước hiện tại, rồi nội dung biên bản. */
export function VerifierRecordDetail({
  recordId,
  onBack,
}: {
  recordId: string;
  onBack: () => void;
}) {
  const client = useQueryClient();
  const sign = usePrivateAction();
  const signed = useSuccessHold();
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
  // Nút ký xác minh chỉ nằm trong khung "Xem biên bản", ngay ô chữ ký của luật sư. Ký rồi thì ô đó hiện "Đã ký điện tử".
  const signButton =
    isSigningStage(record.status) && record.canSign ? (
      <>
        <ActionButton
          className={buttonStyles.dark}
          disabled={sign.pending}
          onClick={() =>
            void sign.execute(
              () => signed.hold(() => handoverRecordService.signAsVerifier(record.id)),
              (next) => {
                client.setQueryData(handoverRecordKeys.verifier(next.id), next);
                void client.invalidateQueries({ queryKey: handoverRecordKeys.root });
              },
            )
          }
          pending={sign.pending}
          done={signed.done}
          pendingLabel="Đang ký…"
          doneLabel="Đã ký"
        >
          Ký xác minh
        </ActionButton>
        {sign.error && (
          <p role="alert" className="max-w-56 text-center text-sm text-destructive">
            {sign.error}
          </p>
        )}
      </>
    ) : undefined;
  const signAction = signButton ? { target: "verifier" as const, node: signButton } : undefined;
  return (
    <div className="space-y-6">
      <button type="button" className={buttonStyles.outline} onClick={onBack}>
        Về danh sách
      </button>
      <RecordStepper status={record.status} />
      {record.status === "CANCELLED" && (
        <Notice tone="neutral" title="Bạn đã hủy biên bản này">
          {record.cancelReason ? `Lý do: ${record.cancelReason}. ` : ""}
          Biên bản này không còn hiệu lực. Kho đã mở khóa cho Chủ kho.
        </Notice>
      )}
      {record.status === "DRAFTING" && <RecordReportsPanel record={record} />}
      {record.status === "DRAFTING" &&
        (record.claims.length > 0 || record.reports.length === 0) && (
          <ClaimsReviewPanel record={record} />
        )}
      {record.status === "DRAFTING" && (
        <RecordLinesEditor key={`${record.id}-${record.revisionNo}`} record={record} />
      )}
      {record.status !== "CANCELLED" && <EvidencePanel record={record} />}
      {record.status === "DRAFTING" && <CancelRecordPanel record={record} />}
      {isSigningStage(record.status) && (
        <FinalizedActions record={record} signPending={sign.pending} />
      )}
      {record.status === "COMPLETED" && (
        <Notice tone="success" title="Mọi người nhận đã ký">
          Biên bản đã đủ chữ ký của bạn, Người thực thi và mọi người nhận. Từng người nhận đã được
          mở quyền tải phần của mình; Người thực thi gửi mã nhận cho từng người.
        </Notice>
      )}
      <RecordDocument
        record={record}
        signAction={signAction}
        renderRecipientAction={
          isSigningStage(record.status)
            ? (recipient) => <IdentityAction recipient={recipient} />
            : undefined
        }
      />
    </div>
  );
}
