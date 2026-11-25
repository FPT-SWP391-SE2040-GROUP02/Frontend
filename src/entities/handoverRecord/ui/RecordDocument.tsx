import type { ReactNode } from "react";
import { formatDateTime, InfoRow, Panel, StatusText } from "@/shared/ui/heritageKit";
import type { HandoverRecord, RecordRecipient } from "../model/handoverRecord.schema";
import {
  deliveryText,
  identityText,
  recordStatusLabel,
  receiptText,
  signatureCount,
} from "../model/recordPresentation";
import { PaperPreviewButton } from "./PaperPreviewButton";
import { ReceiptPaper } from "./ReceiptPaper";
import { RecordPaper } from "./RecordPaper";

function SignedCell({ at }: { at: string | null }) {
  if (at) return <StatusText tone="success">{`Đã ký ${formatDateTime(at)}`}</StatusText>;
  return <StatusText>Chưa ký</StatusText>;
}

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
            <ul className="space-y-1">
              {recipient.assets.map((asset) => (
                <li key={asset.assetId} className="font-medium">
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
          <dt className="text-heritage-muted">Chữ ký của bạn</dt>
          <dd>
            <SignedCell at={recipient.signedAt} />
          </dd>
        </div>
        <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 py-3">
          <dt className="text-heritage-muted">Giao phần</dt>
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
 * bảng "ai nhận tài sản nào" kèm danh tính, chữ ký và việc giao phần của từng người, rồi ô chữ ký của luật sư và Người thực thi.
 * renderRecipientAction thêm một cột thao tác cho từng người nhận (ví dụ nút kiểm danh tính của luật sư).
 * layout="stacked" xếp mỗi người nhận thành một khối dọc thay cho bảng ngang, hợp cột hẹp của người nhận.
 */
export function RecordDocument({
  record,
  title = "Biên bản bàn giao",
  renderRecipientAction,
  layout = "table",
}: {
  record: HandoverRecord;
  title?: string;
  renderRecipientAction?: (recipient: RecordRecipient) => ReactNode;
  layout?: "table" | "stacked";
}) {
  const status = recordStatusLabel[record.status];
  const signatures = signatureCount(record);
  return (
    <Panel
      title={title}
      labelledBy={`record-${record.id}`}
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <PaperPreviewButton
            label="Xem biên bản"
            title="Biên bản bàn giao"
            fileName={`Bien-ban-ban-giao-ban-${record.revisionNo}`}
            paper={<RecordPaper record={record} />}
          />
          <StatusText tone={status.tone}>{status.label}</StatusText>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <InfoRow label="Kho">{record.vaultName}</InfoRow>
          <InfoRow label="Chủ kho">{record.ownerName || "—"}</InfoRow>
          <InfoRow label="Luật sư">{record.verifierName || "—"}</InfoRow>
          <InfoRow label="Người thực thi">{record.executorName || "—"}</InfoRow>
          <InfoRow label="Bản số">{String(record.revisionNo)}</InfoRow>
          <InfoRow label="Chữ ký">{`${signatures.signed}/${signatures.total}`}</InfoRow>
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
                    Giao phần của mình
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
                        <ul className="list-disc space-y-1 pl-4">
                          {recipient.assets.map((asset) => (
                            <li key={asset.assetId}>{asset.name || "Tài sản đã bị xóa"}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-4">
                        <StatusText tone={identity.tone}>{identity.label}</StatusText>
                      </td>
                      <td className="px-4 py-4">
                        <SignedCell at={recipient.signedAt} />
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

        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <InfoRow label="Luật sư ký xác minh">
            <SignedCell at={record.verifierSignedAt} />
          </InfoRow>
          <InfoRow label="Người thực thi ký">
            <SignedCell at={record.executorSignedAt} />
          </InfoRow>
        </dl>
        <p className="text-sm leading-6 text-heritage-muted">
          LegacyVault chỉ giữ và giao tài sản theo biên bản này. Việc pháp lý (biên bản phân chia,
          chia theo luật) do luật sư xử lý ở ngoài hệ thống. Ký là bấm xác nhận; hệ thống lưu người
          ký và thời điểm.
        </p>
      </div>
    </Panel>
  );
}
