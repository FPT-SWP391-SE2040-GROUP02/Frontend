import { useState } from "react";
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
      return "Luật sư đang lập biên bản: ai nhận tài sản nào. Bạn chưa phải làm gì.";
    case "IDENTITY_CHECK":
      return "Biên bản đã chốt. Người nhận đã nhận thư mời và đang nộp căn cước để luật sư kiểm.";
    case "SIGNING":
      if (record.canSign)
        return "Mọi người nhận đã được xác nhận danh tính. Mời bạn đọc lại biên bản và ký.";
      return "Bạn đã ký. Đang chờ luật sư và người nhận ký.";
    case "COMPLETED":
      return "Biên bản đã đủ chữ ký. Vào mục Bàn giao để gửi mã nhận cho từng người.";
  }
}

/** Chưa mở bàn giao: Người thực thi xác nhận rồi bấm mở. Không cần nộp giấy tờ nào. */
function OpenHandover({ vaultId }: { vaultId: string }) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [confirmed, setConfirmed] = useState(false);
  return (
    <Panel title="Mở bàn giao" labelledBy="open-handover">
      <div className="space-y-4 text-sm leading-6">
        <p>
          Khi Chủ kho đã qua đời, bạn mở bàn giao trên hệ thống. Hệ thống phân công một luật sư lập
          biên bản bàn giao. Kho bị khóa, không ai sửa được tài sản nữa.
        </p>
        <p className="text-heritage-muted">
          Bạn chỉ giữ hộ và giao tài sản theo biên bản luật sư lập. Bạn không tự chia, bán hay cho
          tài sản.
        </p>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-5 cursor-pointer accent-[#0A281E]"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>Tôi xác nhận Chủ kho đã qua đời và cần bắt đầu bàn giao.</span>
        </label>
        <button
          type="button"
          className={buttonStyles.gold}
          disabled={!confirmed || action.pending}
          onClick={() =>
            void action.execute(
              () => handoverRecordService.open(vaultId),
              (record) => {
                client.setQueryData(handoverRecordKeys.executor(vaultId), record);
                void client.invalidateQueries({ queryKey: ["executor-vaults"] });
              },
            )
          }
        >
          {action.pending ? "Đang mở…" : "Mở bàn giao"}
        </button>
        {action.error && (
          <p role="alert" className="text-destructive">
            {action.error}
          </p>
        )}
      </div>
    </Panel>
  );
}

/** Mục Biên bản bàn giao của Người thực thi: mở bàn giao, theo dõi ba bước và ký khi tới lượt. */
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
  if (!record) return <OpenHandover vaultId={vaultId} />;
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
              className={buttonStyles.gold}
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
