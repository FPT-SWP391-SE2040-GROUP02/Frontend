import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { buttonStyles, formatDateTime, Notice, Panel } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord, RecordRecipient } from "../model/handoverRecord.schema";
import { isSigningStage, signBlockedText } from "../model/recordPresentation";
import { handoverRecordKeys, useExecutorRecord } from "../model/useHandoverRecord";
import { RecipientSignButton } from "./RecipientSignButton";
import { PaperPreviewButton } from "./PaperPreviewButton";
import { ReceiptPaper } from "./ReceiptPaper";
import { RecordDocument } from "./RecordDocument";
import { RecordStepper } from "./RecordStepper";

/** Câu cho Người thực thi biết biên bản đang chờ ai. */
function waitingText(record: HandoverRecord): string {
  switch (record.status) {
    case "DRAFTING":
      return "Người nhận đã gửi yêu cầu kèm giấy tờ. Luật sư đang xét giấy tờ và lập phương án chia: ai nhận tài sản nào. Bạn chưa phải làm gì.";
    case "IDENTITY_CHECK":
    case "SIGNING":
      if (record.canSign)
        return "Luật sư đã ký phần của người nhận đang chờ bạn. Bấm Xem và ký ở dòng người đó. Thứ tự ký mỗi phần: luật sư, bạn, rồi người nhận; ai đủ chữ ký trước thì được bàn giao trước.";
      return "Bạn ký riêng phần của từng người nhận sau khi luật sư ký phần đó. Người nào đủ chữ ký thì vào mục Bàn giao để gửi mã nhận.";
    case "COMPLETED":
      return "Mọi người nhận đã ký. Vào mục Bàn giao để gửi mã nhận cho người chưa có mã.";
    case "CANCELLED":
      return "Yêu cầu nhận tài sản đã được hủy. Kho đã mở khóa.";
  }
}

/** Phần của một người nhận đang chờ gì, nói cho Người thực thi. */
function executorStepText(record: HandoverRecord, recipient: RecordRecipient): string {
  if (recipient.canSign) return "Luật sư đã ký phần này. Bạn ký được ngay.";
  const signedAt = recipient.executorSignedAt ?? record.executorSignedAt;
  if (signedAt) return `Bạn đã ký ${formatDateTime(signedAt)}.`;
  // Lý do do Backend trả theo luật thứ tự ký; FE chỉ đổi ra câu dễ hiểu.
  const reason = signBlockedText(recipient.signBlockedReason);
  if (reason) return `${reason}.`;
  return "Chờ luật sư xác nhận danh tính người này.";
}

/** Chưa có yêu cầu nhận tài sản: Người thực thi chưa phải làm gì; người nhận là người gửi yêu cầu kèm giấy tờ. */
function WaitingForRequest() {
  return (
    <Panel title="Chưa có yêu cầu nhận tài sản" labelledBy="waiting-request">
      <div className="space-y-3 text-sm leading-6">
        <p>
          Khi Chủ tài sản qua đời, người nhận sẽ gửi yêu cầu nhận tài sản kèm giấy tờ. Hệ thống báo
          cho bạn và phân công một luật sư xét giấy tờ. Luật sư chấp nhận thì kho mới khóa, rồi lập
          phương án chia tài sản.
        </p>
        <p className="text-heritage-muted">
          Bạn chỉ giữ mã nhận và giao tài sản theo biên bản luật sư lập. Bạn không tự chia, bán hay
          cho tài sản.
        </p>
      </div>
    </Panel>
  );
}

/** Mục Biên bản bàn giao của Người thực thi: theo dõi biên bản và ký ngay sau khi luật sư chốt. */
export function ExecutorRecordPanel({ vaultId }: { vaultId: string }) {
  const client = useQueryClient();
  const query = useExecutorRecord(vaultId);
  if (query.isPending) return <p role="status">Đang tải biên bản…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không tải được biên bản hoặc bạn không có quyền trong kho này.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  const record = query.data;
  if (!record) return <WaitingForRequest />;
  const apply = (next: HandoverRecord) => {
    client.setQueryData(handoverRecordKeys.executor(vaultId), next);
    void client.invalidateQueries({ queryKey: ["executor-vaults"] });
  };
  // Ký xong hết vẫn giữ danh sách để mở lại tờ riêng của từng người.
  const completed = record.status === "COMPLETED";
  let recipientsTitle = "Ký cho từng người nhận";
  if (completed) recipientsTitle = "Tờ biên bản của từng người nhận";
  return (
    <div className="space-y-6">
      <RecordStepper status={record.status} />
      <Notice tone={record.status === "COMPLETED" ? "success" : "neutral"} role="status">
        {waitingText(record)}
      </Notice>
      {(isSigningStage(record.status) || completed) && (
        <Panel title={recipientsTitle} labelledBy="executor-signing">
          <ul className="divide-y divide-heritage-border text-sm">
            {record.recipients.map((recipient) => (
              <li
                key={recipient.beneficiaryId}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{recipient.fullName || "—"}</p>
                  <p className="text-heritage-muted">{executorStepText(record, recipient)}</p>
                </div>
                {(isSigningStage(record.status) || recipient.executorSignedAt) && (
                  <RecipientSignButton
                    record={record}
                    recipient={recipient}
                    target="executor"
                    sign={() =>
                      handoverRecordService.signAsExecutor(vaultId, recipient.beneficiaryId)
                    }
                    onSigned={apply}
                  />
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <RecordDocument record={record} />
    </div>
  );
}

/**
 * Nút "Xem và ký phiếu giao nhận" của Người thực thi cho một người nhận: mở tờ phiếu, nút ký nằm ngay ô chữ ký "Bên giao".
 * `signNode` do nơi gọi dựng (nút ký gọi API nằm ở tầng feature). Chưa có biên bản hoặc người nhận thì chưa hiện nút.
 */
export function ExecutorReceiptSignButton({
  vaultId,
  turnId,
  signNode,
}: {
  vaultId: string;
  turnId: string;
  signNode: ReactNode;
}) {
  const query = useExecutorRecord(vaultId);
  const record = query.data;
  const recipient = record?.recipients.find((item) => item.turnId === turnId);
  if (!record || !recipient) return null;
  return (
    <PaperPreviewButton
      label="Xem và ký phiếu giao nhận"
      title="Phiếu giao nhận"
      fileName="Phieu-giao-nhan"
      primary
      paper={
        <ReceiptPaper
          record={record}
          recipient={recipient}
          signAction={{ target: "executor", node: signNode }}
        />
      }
    />
  );
}
