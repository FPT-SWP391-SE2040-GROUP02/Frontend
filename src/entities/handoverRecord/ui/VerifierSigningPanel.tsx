import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/shared/config/routes.config";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Chip, formatDateTime } from "@/shared/ui/heritageKit";
import { compactButton, SectionCard, tableStyles } from "@/shared/ui/SectionCard";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord, RecordRecipient } from "../model/handoverRecord.schema";
import {
  deliveryText,
  identityText,
  isSigningStage,
  receiptText,
  recordStatusLabel,
  signatureCount,
} from "../model/recordPresentation";
import { handoverRecordKeys } from "../model/useHandoverRecord";
import { PaperPreviewButton } from "./PaperPreviewButton";
import { ReceiptPaper } from "./ReceiptPaper";
import { RecipientSignButton } from "./RecipientSignButton";
import { RecordPaper } from "./RecordPaper";
import { RemindExecutorButton } from "./RemindExecutorButton";

/** Lý do không mở lại được biên bản khi đã giao cho ít nhất một người nhận. */
const PARTIALLY_DELIVERED_TEXT =
  "Đã giao tài sản cho ít nhất một người nhận nên không mở lại được biên bản. Sai sót sau khi giao xử lý ngoài hệ thống.";

function SignedChip({ at }: { at: string | null }) {
  if (at) return <Chip tone="success">{`Đã ký ${formatDateTime(at)}`}</Chip>;
  return <Chip tone="neutral">Chưa ký</Chip>;
}

/** Ba chữ ký của phần một người nhận, theo thứ tự: Người thực thi, luật sư, người nhận. */
function Signatures({ record, recipient }: { record: HandoverRecord; recipient: RecordRecipient }) {
  const rows: [string, string | null][] = [
    ["Người thực thi", recipient.executorSignedAt ?? record.executorSignedAt],
    ["Luật sư", recipient.verifierSignedAt ?? record.verifierSignedAt],
    ["Người nhận", recipient.signedAt],
  ];
  return (
    <ul className="space-y-1">
      {rows.map(([role, at]) => (
        <li key={role} className="flex flex-wrap items-center gap-2">
          <span className="w-28 text-heritage-muted">{role}</span>
          <SignedChip at={at} />
        </li>
      ))}
    </ul>
  );
}

function RecipientRow({
  record,
  recipient,
  onSigned,
}: {
  record: HandoverRecord;
  recipient: RecordRecipient;
  onSigned: (next: HandoverRecord) => void;
}) {
  const identity = identityText(recipient);
  const delivery = deliveryText(record, recipient);
  const receipt = receiptText(recipient);
  const delivered = recipient.turnStatus === "HANDOVER_COMMITTED";
  const canCheck =
    isSigningStage(record.status) && recipient.submissionId && !recipient.identityConfirmedAt;
  return (
    <tr className="align-top">
      <td className={tableStyles.td}>
        <p className="font-semibold">{recipient.fullName || "—"}</p>
        <p className="text-heritage-muted">{`CCCD ${recipient.citizenId}`}</p>
      </td>
      <td className={tableStyles.td}>
        {recipient.assets.map((asset) => asset.name || "Tài sản đã bị xóa").join(", ")}
      </td>
      <td className={tableStyles.td}>
        <Chip tone={identity.tone}>{identity.label}</Chip>
      </td>
      <td className={tableStyles.td}>
        <Signatures record={record} recipient={recipient} />
      </td>
      <td className={tableStyles.td}>
        <div className="flex flex-col items-start gap-1">
          <Chip tone={delivery.tone}>{delivery.label}</Chip>
          {delivered && <Chip tone={receipt.tone}>{receipt.label}</Chip>}
          {recipient.receiptIssueNote && (
            <p className="text-heritage-muted">{`“${recipient.receiptIssueNote}”`}</p>
          )}
        </div>
      </td>
      <td className={`${tableStyles.td} text-right`}>
        {canCheck && (
          <Link
            className={compactButton.dark}
            to={`${ROUTES.NOTARY.RECIPIENTS}?submissionId=${recipient.submissionId}`}
          >
            Kiểm danh tính
          </Link>
        )}
        {(recipient.canSign || (!delivered && recipient.verifierSignedAt)) && (
          <RecipientSignButton
            record={record}
            recipient={recipient}
            target="verifier"
            sign={() => handoverRecordService.signAsVerifier(record.id, recipient.beneficiaryId)}
            onSigned={onSigned}
          />
        )}
        {delivered && (
          <PaperPreviewButton
            label="Xem phiếu"
            title="Phiếu giao nhận"
            fileName="Phieu-giao-nhan"
            paper={<ReceiptPaper record={record} recipient={recipient} />}
          />
        )}
      </td>
    </tr>
  );
}

/**
 * Màn của luật sư sau khi chốt (kể cả đã hoàn tất hoặc đã hủy): thông tin biên bản và một bảng người nhận. Chữ ký và
 * nút "Xem và ký" nằm trên dòng của từng người nhận: ai xong danh tính trước thì ký và giao trước.
 */
export function VerifierSigningPanel({ record }: { record: HandoverRecord }) {
  const client = useQueryClient();
  const reopen = usePrivateAction();
  const signing = isSigningStage(record.status);
  const status = recordStatusLabel[record.status];
  const signatures = signatureCount(record);
  const apply = (next: HandoverRecord) => {
    client.setQueryData(handoverRecordKeys.verifier(next.id), next);
    void client.invalidateQueries({ queryKey: handoverRecordKeys.root });
  };
  const waiting = record.recipients.filter((recipient) => !recipient.identityConfirmedAt).length;
  // Đã giao cho ít nhất một người thì Backend chặn mở lại (PARTIALLY_DELIVERED): ẩn nút.
  const delivered = record.recipients.some((r) => r.turnStatus === "HANDOVER_COMMITTED");
  return (
    <div className="space-y-5">
      <SectionCard
        title={signing ? "Bước 2 · Ký và giao từng người" : "Biên bản bàn giao"}
        subtitle={`${record.vaultName} · Chủ tài sản: ${record.ownerName || "—"} · Bản số ${record.revisionNo} · ${signatures.signed}/${signatures.total} chữ ký`}
        labelledBy="record-signing"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={status.tone}>{status.label}</Chip>
            <PaperPreviewButton
              label="Xem biên bản"
              title="Biên bản bàn giao"
              fileName={`Bien-ban-ban-giao-ban-${record.revisionNo}`}
              paper={<RecordPaper record={record} />}
            />
          </div>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
          <p className="text-heritage-muted">
            {`Luật sư: ${record.verifierName || "—"} · Người thực thi: ${record.executorName || "—"}`}
          </p>
          {signing && !record.executorSignedAt && (
            <RemindExecutorButton record={record} onUpdated={apply} />
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Người nhận"
        subtitle={
          signing && waiting > 0
            ? `Còn ${waiting} người nhận chưa được xác nhận danh tính. Xác nhận xong ai thì ký được cho người đó.`
            : "Xác nhận danh tính người nào thì ký được cho người đó."
        }
        labelledBy="record-recipients"
      >
        {record.recipients.length === 0 ? (
          <p role="status" className="p-8 text-center text-sm text-heritage-muted">
            Biên bản chưa có người nhận nào.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className={`${tableStyles.table} min-w-[760px]`}>
              <caption className="sr-only">Người nhận và tài sản trong biên bản</caption>
              <thead>
                <tr className={tableStyles.head}>
                  <th scope="col" className={tableStyles.th}>
                    Người nhận
                  </th>
                  <th scope="col" className={tableStyles.th}>
                    Tài sản
                  </th>
                  <th scope="col" className={tableStyles.th}>
                    Danh tính
                  </th>
                  <th scope="col" className={tableStyles.th}>
                    Chữ ký phần này
                  </th>
                  <th scope="col" className={tableStyles.th}>
                    Giao nhận
                  </th>
                  <th scope="col" className={tableStyles.th}>
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className={tableStyles.body}>
                {record.recipients.map((recipient) => (
                  <RecipientRow
                    key={recipient.beneficiaryId}
                    record={record}
                    recipient={recipient}
                    onSigned={apply}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {signing && !delivered && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-heritage-muted">
            Mở lại biên bản thì mọi chữ ký mất hiệu lực, các bên phải ký lại.
          </p>
          <button
            type="button"
            className={compactButton.outline}
            disabled={reopen.pending}
            onClick={() =>
              void reopen.execute(() => handoverRecordService.reopen(record.id), apply)
            }
          >
            {reopen.pending ? "Đang mở lại…" : "Mở lại biên bản để sửa"}
          </button>
        </div>
      )}
      {signing && delivered && (
        <p role="note" className="text-sm text-heritage-muted">
          {PARTIALLY_DELIVERED_TEXT}
        </p>
      )}
      {reopen.error && (
        <p role="alert" className="text-sm text-destructive">
          {reopen.error}
        </p>
      )}
    </div>
  );
}
