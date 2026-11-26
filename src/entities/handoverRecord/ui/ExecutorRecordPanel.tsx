import { useQueryClient } from "@tanstack/react-query";
import { buttonStyles, formatDateTime, Notice, Panel } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord, RecordRecipient } from "../model/handoverRecord.schema";
import { isSigningStage } from "../model/recordPresentation";
import { handoverRecordKeys, useExecutorRecord } from "../model/useHandoverRecord";
import { RecipientSignButton } from "./RecipientSignButton";
import { RecordDocument } from "./RecordDocument";
import { RecordStepper } from "./RecordStepper";

/** Câu cho Người thực thi biết biên bản đang chờ ai. */
function waitingText(record: HandoverRecord): string {
  switch (record.status) {
    case "DRAFTING":
      return "Người nhận đã gửi yêu cầu kèm giấy tờ. Luật sư đang xét giấy tờ và lập biên bản: ai nhận tài sản nào. Bạn chưa phải làm gì.";
    case "IDENTITY_CHECK":
    case "SIGNING":
      if (record.canSign)
        return "Có người nhận đã được xác nhận danh tính. Bấm Xem và ký ở dòng người đó; bạn và luật sư ký trước hay sau đều được. Ai đủ chữ ký trước thì được bàn giao trước.";
      return "Bạn ký riêng cho từng người nhận sau khi luật sư xác nhận danh tính người đó. Người nào đủ chữ ký thì vào mục Bàn giao để gửi mã nhận.";
    case "COMPLETED":
      return "Mọi người nhận đã ký. Vào mục Bàn giao để gửi mã nhận cho người chưa có mã.";
    case "CANCELLED":
      return "Yêu cầu nhận tài sản đã được hủy. Kho đã mở khóa.";
  }
}

/** Phần của một người nhận đang chờ gì, nói cho Người thực thi. */
function executorStepText(record: HandoverRecord, recipient: RecordRecipient): string {
  if (recipient.canSign) return "Đã xác nhận danh tính. Bạn ký được ngay.";
  const signedAt = recipient.executorSignedAt ?? record.executorSignedAt;
  if (signedAt) return `Bạn đã ký ${formatDateTime(signedAt)}.`;
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
          biên bản bàn giao.
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
  return (
    <div className="space-y-6">
      <RecordStepper status={record.status} />
      <Notice tone={record.status === "COMPLETED" ? "success" : "neutral"} role="status">
        {waitingText(record)}
      </Notice>
      {isSigningStage(record.status) && (
        <Panel title="Ký cho từng người nhận" labelledBy="executor-signing">
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
                {(recipient.canSign || recipient.executorSignedAt) && (
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
