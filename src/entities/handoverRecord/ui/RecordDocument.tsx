import type { ReactNode } from "react";
import { InfoRow, Panel, StatusText } from "@/shared/ui/heritageKit";
import type { HandoverRecord, RecordRecipient } from "../model/handoverRecord.schema";
import {
  deliveryText,
  fullySignedCount,
  identityText,
  partySignedText,
  recordStatusLabel,
  receiptText,
} from "../model/recordPresentation";
import { PaperPreviewButton } from "./PaperPreviewButton";
import { ReceiptPaper } from "./ReceiptPaper";
import { RecordPaper, type PaperSignAction } from "./RecordPaper";
import { SignatureParties } from "./SignatureParties";

/** Một người nhận dạng thẻ dọc (cột hẹp của người nhận): tên, rồi từng dòng "nhãn: giá trị". */
function RecipientBlock({
  record,
  recipient,
}: {
  record: HandoverRecord;
  recipient: RecordRecipient;
}) {
  const identity = identityText(recipient);
  const delivery = deliveryText(record, recipient);
  const receipt = receiptText(recipient);
  return (
    <section className="space-y-4">
      <div>
        <p className="text-base font-semibold">{recipient.fullName || "—"}</p>
        <p className="text-sm text-heritage-muted">{`CCCD ${recipient.citizenId}`}</p>
      </div>
      <dl className="divide-y divide-heritage-border border-y border-heritage-border text-sm">
        <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-3">
          <dt className="text-heritage-muted">Tài sản được nhận</dt>
          <dd>
            <ul className="flex flex-wrap gap-1.5">
              {recipient.assets.map((asset) => (
                <li
                  key={asset.assetId}
                  className="rounded-full bg-heritage-sunken px-2.5 py-0.5 font-medium"
                >
                  {asset.name || "Tài sản đã bị xóa"}
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-3">
          <dt className="text-heritage-muted">Danh tính</dt>
          <dd>
            <StatusText tone={identity.tone}>{identity.label}</StatusText>
          </dd>
        </div>
        <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-3">
          <dt className="text-heritage-muted">Chữ ký</dt>
          <dd>
            <SignatureParties record={record} recipient={recipient} />
          </dd>
        </div>
        <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-3">
          <dt className="text-heritage-muted">Giao</dt>
          <dd>
            <StatusText tone={delivery.tone}>{delivery.label}</StatusText>
          </dd>
        </div>
        <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-3">
          <dt className="text-heritage-muted">Phiếu giao nhận</dt>
          <dd className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <StatusText tone={receipt.tone}>{receipt.label}</StatusText>
              {recipient.receiptIssueNote && (
                <p className="text-heritage-muted">{`“${recipient.receiptIssueNote}”`}</p>
              )}
            </div>
            {recipient.turnStatus === "HANDOVER_COMMITTED" && (
              <PaperPreviewButton
                label="Xem phiếu"
                title="Phiếu giao nhận"
                fileName="Phieu-giao-nhan"
                paper={<ReceiptPaper record={record} recipient={recipient} />}
              />
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

/**
 * Nội dung biên bản bàn giao dùng chung cho luật sư, Người thực thi và người nhận: thông tin kho,
 * bảng "ai nhận tài sản nào" kèm danh tính, chữ ký ba bên theo thứ tự ký và việc giao phần của từng người, rồi số phần
 * luật sư và Người thực thi đã ký.
 * renderRecipientAction thêm một cột thao tác cho từng người nhận (ví dụ nút kiểm danh tính của luật sư).
 * layout="stacked" xếp mỗi người nhận thành một khối dọc thay cho bảng ngang, hợp cột hẹp của người nhận.
 * signAction là nút ký của người đang xem (khi có, nút mở khung đổi nhãn thành "Xem và ký biên bản"); nó chỉ hiện trong khung "Xem biên bản", ngay tại ô chữ ký của chính người đó
 * (Người thực thi, luật sư hoặc người nhận), để người ký đọc xong tờ biên bản rồi ký ngay tại đó.
 */
export function RecordDocument({
  record,
  title = "Biên bản bàn giao",
  renderRecipientAction,
  layout = "table",
  signAction,
}: {
  record: HandoverRecord;
  title?: string;
  renderRecipientAction?: (recipient: RecordRecipient) => ReactNode;
  layout?: "table" | "stacked";
  signAction?: PaperSignAction;
}) {
  const status = recordStatusLabel[record.status];
  const signatures = fullySignedCount(record);
  return (
    <Panel
      title={title}
      labelledBy={`record-${record.id}`}
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <PaperPreviewButton
            label={signAction ? "Xem và ký biên bản" : "Xem biên bản"}
            title="Biên bản bàn giao"
            fileName={`Bien-ban-ban-giao-ban-${record.revisionNo}`}
            paper={<RecordPaper record={record} signAction={signAction} />}
          />
          <StatusText tone={status.tone}>{status.label}</StatusText>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <InfoRow label="Kho">{record.vaultName}</InfoRow>
          <InfoRow label="Chủ tài sản">{record.ownerName || "—"}</InfoRow>
          <InfoRow label="Luật sư">{record.verifierName || "—"}</InfoRow>
          <InfoRow label="Người thực thi">{record.executorName || "—"}</InfoRow>
          <InfoRow label="Bản số">{String(record.revisionNo)}</InfoRow>
          <InfoRow label="Đủ chữ ký">{`${signatures.signed}/${signatures.total} người nhận`}</InfoRow>
        </div>

        {record.recipients.length === 0 ? (
          <p role="status" className="text-sm text-heritage-muted">
            Biên bản chưa có người nhận nào.
          </p>
        ) : layout === "stacked" ? (
          <div className="space-y-6">
            {record.recipients.map((recipient) => (
              <RecipientBlock key={recipient.beneficiaryId} record={record} recipient={recipient} />
            ))}
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Người nhận và tài sản trong biên bản</caption>
              <thead>
                <tr className="border-b border-heritage-border text-sm text-heritage-muted">
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Người nhận
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Tài sản được nhận
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Danh tính
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Chữ ký
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Giao
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Phiếu giao nhận
                  </th>
                  {renderRecipientAction && (
                    <th scope="col" className="px-4 py-3 font-semibold">
                      <span className="sr-only">Thao tác</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-heritage-border">
                {record.recipients.map((recipient) => {
                  const identity = identityText(recipient);
                  const delivery = deliveryText(record, recipient);
                  const receipt = receiptText(recipient);
                  return (
                    <tr key={recipient.beneficiaryId} className="align-top">
                      <td className="py-4 pr-4">
                        <span className="block font-semibold">{recipient.fullName || "—"}</span>
                        <span className="text-heritage-muted">{`CCCD ${recipient.citizenId}`}</span>
                      </td>
                      <td className="px-4 py-4">
                        <ul className="flex flex-wrap gap-1.5">
                          {recipient.assets.map((asset) => (
                            <li
                              key={asset.assetId}
                              className="rounded-full bg-heritage-sunken px-2.5 py-0.5"
                            >
                              {asset.name || "Tài sản đã bị xóa"}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-4">
                        <StatusText tone={identity.tone}>{identity.label}</StatusText>
                      </td>
                      <td className="px-4 py-4">
                        <SignatureParties record={record} recipient={recipient} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusText tone={delivery.tone}>{delivery.label}</StatusText>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <StatusText tone={receipt.tone}>{receipt.label}</StatusText>
                          {recipient.receiptIssueNote && (
                            <p className="text-heritage-muted">{`“${recipient.receiptIssueNote}”`}</p>
                          )}
                          {recipient.turnStatus === "HANDOVER_COMMITTED" && (
                            <PaperPreviewButton
                              label="Xem phiếu"
                              title="Phiếu giao nhận"
                              fileName="Phieu-giao-nhan"
                              paper={<ReceiptPaper record={record} recipient={recipient} />}
                            />
                          )}
                        </div>
                      </td>
                      {renderRecipientAction && (
                        <td className="px-4 py-4">{renderRecipientAction(recipient)}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-sm font-semibold">{partySignedText(record)}</p>
        <p className="text-sm leading-6 text-heritage-muted">
          LegacyVault chỉ giữ và giao tài sản theo biên bản này. Việc pháp lý (biên bản phân chia,
          chia theo luật) do luật sư xử lý ở ngoài hệ thống. Ký là bấm xác nhận; hệ thống lưu người
          ký và thời điểm.
        </p>
      </div>
    </Panel>
  );
}
