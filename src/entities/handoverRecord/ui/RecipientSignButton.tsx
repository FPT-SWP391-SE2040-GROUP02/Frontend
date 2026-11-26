import { useId } from "react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { ActionButton } from "@/shared/ui/ActionButton";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";
import type { HandoverRecord, RecordRecipient } from "../model/handoverRecord.schema";
import { signBlockedText } from "../model/recordPresentation";
import { PaperPreviewButton } from "./PaperPreviewButton";
import { RecordPaper } from "./RecordPaper";

const SIGN_TEXT = { verifier: "Ký xác minh", executor: "Ký biên bản" };

/**
 * Nút "Xem và ký" trên dòng một người nhận: mở tờ riêng của phần người đó, nút ký nằm ngay ô chữ ký của người đang xem.
 * Luật sư và Người thực thi ký riêng cho từng người nhận. Ký rồi (kể cả đã giao) vẫn mở lại tờ này được.
 * Chưa tới lượt (Backend trả canSign = false kèm signBlockedReason) thì nút bị khóa và hiện lý do, ví dụ
 * "Chờ luật sư ký phần này"; FE không tự suy thứ tự ký.
 */
export function RecipientSignButton({
  record,
  recipient,
  target,
  sign,
  onSigned,
}: {
  record: HandoverRecord;
  recipient: RecordRecipient;
  target: "verifier" | "executor";
  sign: () => Promise<HandoverRecord>;
  onSigned: (next: HandoverRecord) => void;
}) {
  const action = usePrivateAction();
  const done = useSuccessHold();
  const reasonId = useId();
  const name = recipient.fullName || "người nhận";
  // Tờ riêng giống tờ người nhận tự xem: một người ở Điều 1, một ô Bên nhận, chữ ký của đúng phần này, không liệt kê
  // khác biệt của cả biên bản (trong đó có người nhận khác).
  const forRecipient: HandoverRecord = {
    ...record,
    recipients: [recipient],
    splitDifferences: [],
    verifierSignedAt: recipient.verifierSignedAt,
    executorSignedAt: recipient.executorSignedAt,
  };
  const node = recipient.canSign ? (
    <>
      <ActionButton
        className={buttonStyles.dark}
        pending={action.pending}
        done={done.done}
        pendingLabel="Đang ký…"
        doneLabel="Đã ký"
        onClick={() => void action.execute(() => done.hold(sign), onSigned)}
      >
        {SIGN_TEXT[target]}
      </ActionButton>
      <p className="text-center text-sm text-heritage-muted">{`Cho phần của ${name}`}</p>
      {action.error && (
        <p role="alert" className="max-w-56 text-center text-sm text-destructive">
          {action.error}
        </p>
      )}
    </>
  ) : undefined;
  let mySignedAt = recipient.executorSignedAt;
  if (target === "verifier") mySignedAt = recipient.verifierSignedAt;
  if (!recipient.canSign && !mySignedAt) {
    const reason = signBlockedText(recipient.signBlockedReason) || "Chưa tới lượt ký";
    return (
      <div className="flex flex-col items-end gap-1">
        <button type="button" className={buttonStyles.outline} disabled aria-describedby={reasonId}>
          Xem và ký
        </button>
        <p id={reasonId} className="max-w-56 text-right text-sm text-heritage-muted">
          {reason}
        </p>
      </div>
    );
  }
  return (
    <PaperPreviewButton
      label={recipient.canSign ? "Xem và ký" : "Xem tờ đã ký"}
      title="Biên bản bàn giao"
      fileName={`Bien-ban-ban-giao-ban-${record.revisionNo}`}
      primary={recipient.canSign}
      paper={<RecordPaper record={forRecipient} signAction={node ? { target, node } : undefined} />}
    />
  );
}
