import type { ReactNode } from "react";
import { formatDateTime } from "@/shared/ui/heritageKit";
import type { HandoverRecord, RecordRecipient } from "../model/handoverRecord.schema";
import { BODY, CELL, HEADING, longDate, orBlank, SECTION } from "../model/paperFormat";
import { PaperFrame, SignatureSlot } from "./paperKit";

/** Ngày lập phiếu: lúc người nhận xác nhận; chưa xác nhận thì để trống. */
function receiptDate(recipient: RecordRecipient): string | null {
  if (recipient.receiptExecutorSignedAt) {
    return recipient.receiptExecutorSignedAt;
  }
  return recipient.receivedAllAt;
}

/**
 * Phiếu giao nhận của một người nhận, ký SAU khi giao: Người thực thi đã giao, người nhận đã nhận đủ và kiểm tra,
 * LegacyVault không chịu trách nhiệm về tài sản hay tranh chấp. Chưa đủ chữ ký thì ghi rõ là bản nháp.
 */
export function ReceiptPaper({
  record,
  recipient,
}: {
  record: HandoverRecord;
  recipient: RecordRecipient;
}) {
  const complete = recipient.receivedAllAt !== null && recipient.receiptExecutorSignedAt !== null;
  const rows: ReactNode[] = [];
  let order = 0;
  for (const asset of recipient.assets) {
    order = order + 1;
    let assetName = asset.name;
    if (assetName.trim().length === 0) {
      assetName = "Tài sản đã bị xóa";
    }
    rows.push(
      <tr key={asset.assetId}>
        <td className={`${CELL} text-center`}>{order}</td>
        <td className={CELL}>{assetName}</td>
      </tr>,
    );
  }
  let draftNote: ReactNode = null;
  if (!complete) {
    draftNote = (
      <p className="mt-3 text-center font-bold text-[#a33]">
        (Bản nháp: chưa đủ chữ ký hai bên, chưa có giá trị xác nhận)
      </p>
    );
  }
  let issue: ReactNode = null;
  if (recipient.receiptIssueNote && recipient.receiptIssueAt) {
    issue = (
      <p className={`${BODY} mt-3`}>
        <span className="font-bold">Người nhận đã báo </span>
        {`lúc ${formatDateTime(recipient.receiptIssueAt)}: ${recipient.receiptIssueNote}`}
      </p>
    );
  }
  return (
    <PaperFrame
      title="PHIẾU GIAO NHẬN TÀI SẢN"
      subtitle={`Theo biên bản bàn giao bản số ${record.revisionNo}`}
    >
      {draftNote}
      <p className={`${BODY} mt-5`}>
        Hôm nay, ngày {longDate(receiptDate(recipient))}, tại hệ thống LegacyVault, chúng tôi gồm:
      </p>
      <ol className="mt-3 list-none space-y-2 leading-7">
        <li>
          <span className="font-bold">Bên giao (Người thực thi): </span>
          {orBlank(record.executorName)}.
        </li>
        <li>
          <span className="font-bold">Bên nhận: </span>
          {orBlank(recipient.fullName)}, căn cước số {orBlank(recipient.citizenId)}.
        </li>
        <li>
          <span className="font-bold">Kho tài sản: </span>
          {orBlank(record.vaultName)}, của Chủ tài sản {orBlank(record.ownerName)}.
        </li>
      </ol>

      <section className={SECTION}>
        <p className={HEADING}>Điều 1. Tài sản đã giao</p>
        <table className="w-full border-collapse text-[15px]">
          <thead>
            <tr>
              <th scope="col" className={`${CELL} w-12 text-center`}>
                STT
              </th>
              <th scope="col" className={`${CELL} text-left`}>
                Tài sản
              </th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
        {issue}
      </section>

      <section className={SECTION}>
        <p className={HEADING}>Điều 2. Xác nhận của hai bên</p>
        <ol className={`${BODY} list-decimal space-y-1 pl-6`}>
          <li>Bên giao đã giao đúng người, đúng và đủ tài sản ghi tại Điều 1.</li>
          <li>
            Bên nhận đã nhận đủ, đã kiểm tra và không có khiếu nại về việc giao nhận; từ lúc ký, bên
            nhận tự chịu trách nhiệm quản lý, sử dụng tài sản.
          </li>
        </ol>
      </section>

      <section className={SECTION}>
        <p className={HEADING}>Điều 3. Trách nhiệm của LegacyVault</p>
        <ol className={`${BODY} list-decimal space-y-1 pl-6`}>
          <li>
            LegacyVault chỉ lưu giữ và chuyển giao tài sản theo biên bản bàn giao do luật sư lập.
          </li>
          <li>
            Sau khi hai bên ký phiếu này, LegacyVault không chịu trách nhiệm về tính hợp pháp, giá
            trị, nội dung của tài sản, về việc phân chia cũng như tranh chấp giữa các bên.
          </li>
          <li>Tranh chấp do các bên tự giải quyết hoặc theo quy định của pháp luật.</li>
        </ol>
      </section>

      <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 max-[480px]:grid-cols-1">
        <SignatureSlot
          role="Bên giao"
          name={record.executorName}
          signedAt={recipient.receiptExecutorSignedAt}
        />
        <SignatureSlot
          role="Bên nhận"
          name={recipient.fullName}
          signedAt={recipient.receivedAllAt}
        />
      </div>
    </PaperFrame>
  );
}
