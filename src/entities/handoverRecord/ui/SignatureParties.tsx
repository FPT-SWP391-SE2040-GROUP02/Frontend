import { formatDateTime } from "@/shared/ui/heritageKit";
import type { HandoverRecord, RecordRecipient } from "../model/handoverRecord.schema";
import { signatureParties } from "../model/recordPresentation";

/**
 * Cột "Chữ ký" của một người nhận, dùng chung cho bảng của luật sư, Người thực thi và người nhận: ba bên theo đúng thứ
 * tự ký (luật sư, Người thực thi, người nhận), mỗi bên có biểu tượng ✓ hoặc – kèm chữ "đã ký"/"chưa ký" (không chỉ dựa
 * vào màu). Di chuột vào dòng đã ký thì thấy thời điểm ký.
 */
export function SignatureParties({
  record,
  recipient,
}: {
  record: HandoverRecord;
  recipient: RecordRecipient;
}) {
  return (
    <ul className="space-y-1" aria-label={`Chữ ký phần của ${recipient.fullName || "người nhận"}`}>
      {signatureParties(record, recipient).map((party) => (
        <li
          key={party.role}
          className="flex flex-wrap items-center gap-1.5"
          title={party.signedAt ? `Đã ký ${formatDateTime(party.signedAt)}` : undefined}
        >
          <span className="min-w-24 text-heritage-muted">{party.role}</span>
          {party.signedAt ? (
            <span className="font-semibold text-heritage-success">
              <span aria-hidden="true">✓ </span>đã ký
            </span>
          ) : (
            <span className="text-heritage-muted">
              <span aria-hidden="true">– </span>chưa ký
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
