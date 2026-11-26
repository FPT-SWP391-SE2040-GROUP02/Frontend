import type { ReactNode } from "react";
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
import { RecordPaper, type PaperSignAction } from "./RecordPaper";
import { RemindExecutorButton } from "./RemindExecutorButton";

/** Lý do không mở lại được biên bản khi đã giao cho ít nhất một người nhận. */
const PARTIALLY_DELIVERED_TEXT =
  "Đã giao tài sản cho ít nhất một người nhận nên không mở lại được biên bản. Sai sót sau khi giao xử lý ngoài hệ thống.";

function SignedChip({ at }: { at: string | null }) {
  if (at) return <Chip tone="success">{`Đã ký ${formatDateTime(at)}`}</Chip>;
  return <Chip tone="neutral">Chưa ký</Chip>;
}

/** Một dòng chữ ký của bên lập hoặc bên thực thi, kèm việc làm được ngay trên dòng đó. */
function SignerRow({
  role,
  name,
  at,
  children,
}: {
  role: string;
  name: string;
  at: string | null;
  children?: ReactNode;
}) {
  return (
    <tr>
      <th scope="row" className={`${tableStyles.td} font-semibold`}>
        {role}
      </th>
      <td className={tableStyles.td}>{name || "—"}</td>
      <td className={tableStyles.td}>
        <SignedChip at={at} />
      </td>
      <td className={`${tableStyles.td} text-right`}>{children}</td>
    </tr>
  );
}

function RecipientRow({
  record,
  recipient,
}: {
  record: HandoverRecord;
  recipient: RecordRecipient;
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
        <SignedChip at={recipient.signedAt} />
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
 * Màn của luật sư sau khi chốt (kể cả đã hoàn tất hoặc đã hủy): hai bảng ngắn, một cho chữ ký của luật sư và Người
 * thực thi, một cho từng người nhận. Nút ký nằm trong khung xem biên bản, ngay ô chữ ký (signAction).
 */
export function VerifierSigningPanel({
  record,
  signAction,
  signPending,
}: {
  record: HandoverRecord;
  signAction?: PaperSignAction;
  signPending: boolean;
}) {
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
              label={signAction ? "Xem và ký biên bản" : "Xem biên bản"}
              title="Biên bản bàn giao"
              fileName={`Bien-ban-ban-giao-ban-${record.revisionNo}`}
              primary={Boolean(signAction)}
              paper={<RecordPaper record={record} signAction={signAction} />}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className={`${tableStyles.table} min-w-[560px]`}>
            <caption className="sr-only">Chữ ký của luật sư và Người thực thi</caption>
            <tbody className={tableStyles.body}>
              <SignerRow role="Luật sư" name={record.verifierName} at={record.verifierSignedAt} />
              <SignerRow
                role="Người thực thi"
                name={record.executorName}
                at={record.executorSignedAt}
              >
                {signing && !record.executorSignedAt && (
                  <RemindExecutorButton record={record} onUpdated={apply} />
                )}
              </SignerRow>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Người nhận"
        subtitle={
          signing && waiting > 0
            ? `Còn ${waiting} người nhận chưa được xác nhận danh tính.`
            : undefined
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
                    Chữ ký
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
            disabled={signPending || reopen.pending}
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
