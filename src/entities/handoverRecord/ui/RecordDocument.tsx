import type { ReactNode } from "react";
import { Chip, formatDateTime, InfoRow, Panel } from "@/shared/ui/heritageKit";
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
  if (at) return <Chip tone="success">{`Đã ký ${formatDateTime(at)}`}</Chip>;
  return <Chip>Chưa ký</Chip>;
}

/**
 * Nội dung biên bản bàn giao dùng chung cho luật sư, Người thực thi và người nhận: thông tin kho,
 * bảng "ai nhận tài sản nào" kèm danh tính, chữ ký và việc giao phần của từng người, rồi ô chữ ký của luật sư và Người thực thi.
 * renderRecipientAction thêm một cột thao tác cho từng người nhận (ví dụ nút kiểm danh tính của luật sư).
 */
export function RecordDocument({
  record,
  title = "Biên bản bàn giao",
  renderRecipientAction,
}: {
  record: HandoverRecord;
  title?: string;
  renderRecipientAction?: (recipient: RecordRecipient) => ReactNode;
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
          <Chip tone={status.tone}>{status.label}</Chip>
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
        ) : (
          <div className="overflow-x-auto">
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
                        <Chip tone={identity.tone}>{identity.label}</Chip>
                      </td>
                      <td className="px-4 py-4">
                        <SignedCell at={recipient.signedAt} />
                      </td>
                      <td className="px-4 py-4">
                        <Chip tone={delivery.tone}>{delivery.label}</Chip>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <Chip tone={receipt.tone}>{receipt.label}</Chip>
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

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-heritage-border p-4">
            <p className="text-sm font-semibold">Luật sư ký xác minh</p>
            <SignedCell at={record.verifierSignedAt} />
          </div>
          <div className="space-y-2 rounded-xl border border-heritage-border p-4">
            <p className="text-sm font-semibold">Người thực thi ký</p>
            <SignedCell at={record.executorSignedAt} />
          </div>
        </div>
        <p className="text-sm leading-6 text-heritage-muted">
          LegacyVault chỉ giữ và giao tài sản theo biên bản này. Việc pháp lý (biên bản phân chia,
          chia theo luật) do luật sư xử lý ở ngoài hệ thống. Ký là bấm xác nhận; hệ thống lưu người
          ký và thời điểm.
        </p>
      </div>
    </Panel>
  );
}
