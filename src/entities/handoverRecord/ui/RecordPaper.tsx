import type { ReactNode } from "react";
import { formatDateTime } from "@/shared/ui/heritageKit";
import { BODY, CELL, HEADING, longDate, orBlank, SECTION } from "../model/paperFormat";
import type { HandoverRecord, RecordRecipient } from "../model/handoverRecord.schema";
import { SignatureSlot } from "./paperKit";

/** Ngày lập biên bản: lúc đủ chữ ký nếu đã xong, không thì lúc biên bản được chốt, cuối cùng là lúc có yêu cầu. */
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
 * Tờ biên bản giao nhận dạng văn bản: Người thực thi bàn giao, người nhận đồng ý nhận (chưa phải đã nhận: người nhận
 * chỉ xác nhận "đã nhận đủ" sau khi tải xong, trên phiếu giao nhận riêng), luật sư chứng kiến,
 * LegacyVault không chịu trách nhiệm về tài sản hay tranh chấp. Sinh từ dữ liệu biên bản Backend trả. Dùng cho khung xem trước và bản in, để các bên đọc và đối chiếu sau này. Ghi số căn cước đầy đủ;
 * chữ ký lấy đúng thời điểm hệ thống lưu, component không tự suy ra chữ ký.
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

  const recipientSlots: ReactNode[] = [];
  for (const recipient of record.recipients) {
    recipientSlots.push(
      <SignatureSlot
        key={recipient.beneficiaryId}
        role="Bên nhận"
        name={recipient.fullName}
        signedAt={recipient.signedAt}
      />,
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

  let legalBasisNote: ReactNode = null;
  if (record.legalBasisConfirmedAt) {
    legalBasisNote = (
      <p className="mt-6 leading-7">
        {`Luật sư ${record.legalBasisConfirmedByName} xác nhận căn cứ pháp lý lúc ${formatDateTime(record.legalBasisConfirmedAt)}`}
      </p>
    );
  }

  return (
    <div className="text-[#111]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      <header className="text-center leading-6">
        <p className="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p className="inline-block border-b border-[#111] pb-1 font-bold">
          Độc lập – Tự do – Hạnh phúc
        </p>
      </header>
      <h2 className="mt-7 text-center text-2xl font-bold tracking-[0.06em]">
        BIÊN BẢN GIAO NHẬN TÀI SẢN SỐ
      </h2>
      <p className="mt-1 text-center">{`Bản số: ${record.revisionNo}`}</p>
      {cancelledNote}
      <p className={`${BODY} mt-5`}>
        Hôm nay, ngày {longDate(recordDate(record))}, tại hệ thống LegacyVault, chúng tôi gồm:
      </p>

      <section className="mt-4">
        <p className={HEADING}>I. CÁC BÊN</p>
        <ol className="list-none space-y-2 leading-7">
          <li>
            <span className="font-bold">1. Kho tài sản: </span>
            {orBlank(record.vaultName)}, của Chủ kho{" "}
            <span className="font-bold">{orBlank(record.ownerName)}</span>.
          </li>
          <li>
            <span className="font-bold">2. Bên giao (Người thực thi): </span>
            {orBlank(record.executorName)}.
          </li>
          <li>
            <span className="font-bold">3. Bên nhận (người nhận): </span>
            {`${record.recipients.length} người, có tên tại Điều 1.`}
          </li>
          <li>
            <span className="font-bold">4. Luật sư chứng kiến và xác minh danh tính: </span>
            {orBlank(record.verifierName)}.
          </li>
        </ol>
      </section>

      <p className={`${BODY} mt-4`}>
        Bên giao bàn giao và bên nhận đồng ý nhận tài sản trong kho nêu trên, các bên cùng xác nhận
        như sau:
      </p>

      <section className={SECTION}>
        <p className={HEADING}>Điều 1. Tài sản giao cho từng người nhận</p>
        <div className="relative overflow-x-auto">{table}</div>
      </section>

      <section className={SECTION}>
        <p className={HEADING}>Điều 2. Cam kết của các bên</p>
        <ol className={`${BODY} list-decimal space-y-1 pl-6`}>
          <li>Bên giao cam kết giao đúng người, đúng và đủ tài sản ghi tại Điều 1.</li>
          <li>
            Mỗi người nhận xác nhận đúng danh tính của mình và đồng ý nhận phần tài sản ghi cho
            mình.
          </li>
          <li>Luật sư xác nhận đã kiểm danh tính từng người nhận ký biên bản này.</li>
          <li>
            Giao xong, bên giao và từng người nhận ký phiếu giao nhận riêng; việc đã nhận đủ chỉ xác
            nhận trên phiếu đó.
          </li>
        </ol>
      </section>

      <section className={SECTION}>
        <p className={HEADING}>Điều 3. Trách nhiệm của LegacyVault</p>
        <ol className={`${BODY} list-decimal space-y-1 pl-6`}>
          <li>
            LegacyVault chỉ là nền tảng lưu giữ và chuyển giao tài sản số theo biên bản này, không
            phải một bên giao nhận.
          </li>
          <li>
            LegacyVault không chịu trách nhiệm về tính hợp pháp, giá trị, nội dung của tài sản, về
            việc phân chia giữa các người nhận, cũng như mọi tranh chấp giữa các bên phát sinh trước
            hoặc sau khi giao nhận.
          </li>
          <li>
            Mọi khiếu nại, tranh chấp do các bên tự giải quyết với nhau hoặc theo quy định của pháp
            luật.
          </li>
        </ol>
      </section>

      <section className={SECTION}>
        <p className={HEADING}>Điều 4. Hiệu lực</p>
        <p className={BODY}>
          Phần của mỗi người nhận có hiệu lực khi có chữ ký của Người thực thi, luật sư và chính
          người nhận đó. Biên bản được lưu trên hệ thống để các bên đối chiếu khi cần; mọi sửa đổi
          phải lập bản số mới.
        </p>
      </section>

      {legalBasisNote}

      <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 max-[480px]:grid-cols-1">
        <SignatureSlot
          role="Bên giao"
          name={record.executorName}
          signedAt={record.executorSignedAt}
        />
        <SignatureSlot
          role="Luật sư chứng kiến"
          name={record.verifierName}
          signedAt={record.verifierSignedAt}
        />
        {recipientSlots}
      </div>

      <p className="mt-8 text-[13px] italic leading-5 text-[#555]">
        Chữ ký điện tử là bấm xác nhận bằng tài khoản LegacyVault; hệ thống lưu người ký và thời
        điểm.
      </p>

      <p className="mt-4 text-sm italic leading-6">
        Biên bản này chỉ áp dụng cho tài sản số lưu trong LegacyVault, không thay thế văn bản khai
        nhận, thỏa thuận phân chia di sản đối với tài sản khác.
      </p>
    </div>
  );
}
