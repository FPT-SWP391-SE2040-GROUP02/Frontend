import { formatDateTime } from "@/shared/ui/heritageKit";
import type { HandoverRecord, RecordRecipient } from "../model/handoverRecord.schema";
import { signatureParties } from "../model/recordPresentation";
import "./signature-seals.css";

/**
 * Cột "Chữ ký" của một người nhận, dùng chung cho bảng của luật sư, Người thực thi và người nhận: ba con dấu theo đúng
 * thứ tự ký (luật sư, Người thực thi, người nhận). Dấu đã ký đóng xuống kèm ✓, dấu chưa ký là vòng nét đứt; dưới mỗi
 * dấu vẫn ghi chữ "đã ký"/"chưa ký" (không chỉ dựa vào màu). Di chuột vào dấu đã ký thì thấy thời điểm ký.
 */
export function SignatureParties({
  record,
  recipient,
}: {
  record: HandoverRecord;
  recipient: RecordRecipient;
}) {
  return (
    <ul className="sign-seals" aria-label={`Chữ ký phần của ${recipient.fullName || "người nhận"}`}>
      {signatureParties(record, recipient).map((party) => (
        <li
          key={party.role}
          className="sign-seal"
          data-signed={party.signedAt !== null}
          title={party.signedAt ? `Đã ký ${formatDateTime(party.signedAt)}` : undefined}
        >
          <span aria-hidden="true" className="sign-seal-mark" />
          <span className="sign-seal-role">{party.role}</span>
          {party.signedAt ? (
            <span className="sign-seal-state">
              <span aria-hidden="true">✓ </span>đã ký
            </span>
          ) : (
            <span className="sign-seal-state">
              <span aria-hidden="true">– </span>chưa ký
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
