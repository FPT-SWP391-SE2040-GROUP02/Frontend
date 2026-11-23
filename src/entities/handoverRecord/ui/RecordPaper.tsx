import type { ReactNode } from "react";
import { formatDateTime } from "@/shared/ui/heritageKit";
import type { HandoverRecord, RecordRecipient } from "../model/handoverRecord.schema";
import { BODY, CELL, HEADING, longDate, orBlank, SECTION } from "../model/paperFormat";
import { PaperFrame, SignatureSlot } from "./paperKit";

/** Ngày lập biên bản: lúc luật sư ký nếu đã ký, không thì lúc biên bản được chốt, cuối cùng là lúc có yêu cầu. */
function recordDate(record: HandoverRecord): string | null {
  if (record.completedAt) {
    return record.completedAt;
  }
  if (record.finalizedAt) {
    return record.finalizedAt;
  }
  return record.requestedAt;
}

function identityLine(recipient: RecordRecipient): string {
  if (recipient.identityConfirmedAt) {
    return `Luật sư đã xác nhận danh tính lúc ${formatDateTime(recipient.identityConfirmedAt)}`;
  }
  return "Chưa được luật sư xác nhận danh tính";
}

/**
 * Tờ biên bản bàn giao: luật sư lập và ký, là yêu cầu chuyển giao gửi Người thực thi (ai nhận tài sản nào). Không nói
 * đã giao hay đã nhận: việc đó ở phiếu giao nhận. Chữ ký lấy đúng thời điểm hệ thống lưu.
 */
export function RecordPaper({ record }: { record: HandoverRecord }) {
  const recipientRows: ReactNode[] = [];
  let order = 0;
  for (const recipient of record.recipients) {
    order = order + 1;
    const assetItems: ReactNode[] = [];
    for (const asset of recipient.assets) {
      let assetName = asset.name;
      if (assetName.trim().length === 0) {
        assetName = "Tài sản đã bị xóa";
      }
      assetItems.push(<li key={asset.assetId}>{assetName}</li>);
    }
    recipientRows.push(
      <tr key={recipient.beneficiaryId}>
        <td className={`${CELL} text-center`}>{order}</td>
        <td className={CELL}>
          <span className="font-bold">{orBlank(recipient.fullName)}</span>
          <br />
          <span className="text-sm">{`Căn cước: ${recipient.citizenId}`}</span>
          <br />
          <span className="text-sm italic">{identityLine(recipient)}</span>
        </td>
        <td className={CELL}>
          <ul className="list-disc pl-5">{assetItems}</ul>
        </td>
      </tr>,
    );
  }

  let table: ReactNode = <p className="italic">Biên bản chưa có người nhận nào.</p>;
  if (recipientRows.length > 0) {
    table = (
      <table className="w-full border-collapse text-[15px]">
        <thead>
          <tr>
            <th scope="col" className={`${CELL} w-12 text-center`}>
              STT
            </th>
            <th scope="col" className={`${CELL} text-left`}>
              Người nhận
            </th>
            <th scope="col" className={`${CELL} text-left`}>
              Tài sản được nhận
            </th>
          </tr>
        </thead>
        <tbody>{recipientRows}</tbody>
      </table>
    );
  }

  let cancelledNote: ReactNode = null;
  if (record.status === "CANCELLED") {
    cancelledNote = (
      <p className="mt-3 text-center font-bold text-[#a33]">
        (Biên bản đã hủy do Chủ kho hủy yêu cầu nhận tài sản)
      </p>
    );
  }

  return (
    <PaperFrame title="BIÊN BẢN BÀN GIAO TÀI SẢN" subtitle={`Bản số: ${record.revisionNo}`}>
      {cancelledNote}
      <p className={`${BODY} mt-5`}>
        Hôm nay, ngày {longDate(recordDate(record))}, tại hệ thống LegacyVault, căn cứ giấy tờ người
        nhận đã nộp và kết quả kiểm tra, luật sư lập biên bản bàn giao như sau:
      </p>

      <section className={SECTION}>
        <p className={HEADING}>Điều 1. Thông tin kho và người phụ trách</p>
        <ol className="list-none space-y-2 leading-7">
          <li>
            <span className="font-bold">Kho tài sản: </span>
            {orBlank(record.vaultName)}, của Chủ kho{" "}
            <span className="font-bold">{orBlank(record.ownerName)}</span>.
          </li>
          <li>
            <span className="font-bold">Luật sư lập biên bản: </span>
            {orBlank(record.verifierName)}.
          </li>
          <li>
            <span className="font-bold">Người thực thi (bên giao): </span>
            {orBlank(record.executorName)}.
          </li>
        </ol>
      </section>

      <section className={SECTION}>
        <p className={HEADING}>Điều 2. Tài sản giao cho từng người nhận</p>
        <div className="overflow-x-auto">{table}</div>
      </section>

      <section className={SECTION}>
        <p className={HEADING}>Điều 3. Yêu cầu chuyển giao</p>
        <ol className={`${BODY} list-decimal space-y-1 pl-6`}>
          <li>Luật sư chịu trách nhiệm về việc kiểm giấy tờ, danh tính và nội dung Điều 2.</li>
          <li>
            Người thực thi giao đúng người, đúng tài sản ghi tại Điều 2, chỉ giao cho người nhận đã
            được luật sư xác nhận danh tính. Người thực thi không xét pháp lý.
          </li>
          <li>
            Giao xong, Người thực thi và người nhận ký phiếu giao nhận riêng cho từng người nhận.
          </li>
        </ol>
      </section>

      <section className={SECTION}>
        <p className={HEADING}>Điều 4. Hiệu lực</p>
        <p className={BODY}>
          Biên bản có hiệu lực khi luật sư ký, được lưu trên hệ thống để đối chiếu. Trước khi ký,
          mọi sửa đổi phải lập bản số mới.
        </p>
      </section>

      <div className="mt-10 flex justify-end">
        <div className="w-1/2">
          <SignatureSlot
            role="Luật sư"
            name={record.verifierName}
            signedAt={record.verifierSignedAt}
          />
        </div>
      </div>
    </PaperFrame>
  );
}
