import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Notice, Panel } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord } from "../model/handoverRecord.schema";
import { handoverRecordKeys, useExecutorRecord } from "../model/useHandoverRecord";
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
        return "Biên bản đã chốt. Mời bạn đọc lại biên bản và ký ngay, không cần chờ người nhận. Người nhận nào có đủ chữ ký thì được mở phần của mình.";
      return "Bạn đã ký. Mỗi người nhận được mở phần của mình khi có chữ ký của luật sư, của bạn và của chính người đó. Vào mục Bàn giao để gửi mã nhận cho người đã được mở.";
    case "COMPLETED":
      return "Mọi người nhận đã ký. Vào mục Bàn giao để gửi mã nhận cho người chưa có mã.";
    case "CANCELLED":
      return "Yêu cầu nhận tài sản đã được hủy. Kho đã mở khóa.";
  }
}

/** Chưa có yêu cầu nhận tài sản: Người thực thi chưa phải làm gì; người nhận là người gửi yêu cầu kèm giấy tờ. */
function WaitingForRequest() {
  return (
    <Panel title="Chưa có yêu cầu nhận tài sản" labelledBy="waiting-request">
      <div className="space-y-3 text-sm leading-6">
        <p>
          Khi Chủ kho qua đời, người nhận sẽ gửi yêu cầu nhận tài sản kèm giấy tờ. Hệ thống báo cho
          bạn và phân công một luật sư xét giấy tờ. Luật sư chấp nhận thì kho mới khóa, rồi lập biên
          bản bàn giao.
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
  const sign = usePrivateAction();
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
  return (
    <div className="space-y-6">
      <RecordStepper status={record.status} />
      <Notice
        tone={record.status === "COMPLETED" ? "success" : "neutral"}
        role="status"
        action={
          record.canSign ? (
            <button
              type="button"
              className={buttonStyles.dark}
              disabled={sign.pending}
              onClick={() =>
                void sign.execute(
                  () => handoverRecordService.signAsExecutor(vaultId),
                  (next) => {
                    client.setQueryData(handoverRecordKeys.executor(vaultId), next);
                    void client.invalidateQueries({ queryKey: ["executor-vaults"] });
                  },
                )
              }
            >
              {sign.pending ? "Đang ký…" : "Ký biên bản"}
            </button>
          ) : undefined
        }
      >
        {waitingText(record)}
      </Notice>
      {sign.error && (
        <p role="alert" className="text-sm text-destructive">
          {sign.error}
        </p>
      )}
      <RecordDocument record={record} />
    </div>
  );
}
