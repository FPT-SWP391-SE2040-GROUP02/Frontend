import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Notice, Panel } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord } from "../model/handoverRecord.schema";
import { handoverRecordKeys, useExecutorRecord } from "../model/useHandoverRecord";
import { PaperPreviewButton } from "./PaperPreviewButton";
import { ReceiptPaper } from "./ReceiptPaper";
import { RecordDocument } from "./RecordDocument";
import { RecordStepper } from "./RecordStepper";
import { ActionButton } from "@/shared/ui/ActionButton";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";

/** Câu cho Người thực thi biết biên bản đang chờ ai. */
function waitingText(record: HandoverRecord): string {
  switch (record.status) {
    case "DRAFTING":
      return "Người nhận đã gửi yêu cầu kèm giấy tờ. Luật sư đang xét giấy tờ và lập biên bản: ai nhận tài sản nào. Bạn chưa phải làm gì.";
    case "IDENTITY_CHECK":
    case "SIGNING":
      if (record.canSign)
        return "Biên bản đã chốt. Bấm Xem và ký biên bản, đọc lại rồi bấm Ký biên bản ở ô chữ ký của Người thực thi, không cần chờ người nhận. Người nhận nào có đủ chữ ký thì được mở phần của mình.";
      return "Bạn đã ký. Mỗi người nhận được mở phần của mình khi có chữ ký của luật sư, của bạn và của chính người đó. Vào mục Bàn giao để gửi mã nhận cho người đã được mở.";
    case "COMPLETED":
      return "Mọi người nhận đã ký. Vào mục Bàn giao để gửi mã nhận cho người chưa có mã.";
    case "CANCELLED":
      return "Yêu cầu nhận tài sản đã được hủy. Tài sản đã mở khóa.";
  }
}

/** Chưa có yêu cầu nhận tài sản: Người thực thi chưa phải làm gì; người nhận là người gửi yêu cầu kèm giấy tờ. */
function WaitingForRequest() {
  return (
    <Panel title="Chưa có yêu cầu nhận tài sản" labelledBy="waiting-request">
      <div className="space-y-3 text-sm leading-6">
        <p>
          Khi Chủ tài sản qua đời, người nhận sẽ gửi yêu cầu nhận tài sản kèm giấy tờ. Hệ thống báo
          cho bạn và phân công một luật sư xét giấy tờ. Luật sư chấp nhận thì tài sản mới khóa, rồi
          lập biên bản bàn giao.
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
  const signed = useSuccessHold();
  const query = useExecutorRecord(vaultId);
  if (query.isPending) return <p role="status">Đang tải biên bản…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không tải được biên bản hoặc bạn không có quyền trong tài sản này.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  const record = query.data;
  if (!record) return <WaitingForRequest />;
  // Nút ký chỉ nằm trong khung "Xem biên bản", ngay ô chữ ký của Người thực thi.
  const signButton = record.canSign ? (
    <>
      <ActionButton
        className={buttonStyles.dark}
        pending={sign.pending}
        done={signed.done}
        pendingLabel="Đang ký…"
        doneLabel="Đã ký"
        onClick={() =>
          void sign.execute(
            () => signed.hold(() => handoverRecordService.signAsExecutor(vaultId)),
            (next) => {
              client.setQueryData(handoverRecordKeys.executor(vaultId), next);
              void client.invalidateQueries({ queryKey: ["executor-vaults"] });
            },
          )
        }
      >
        Ký biên bản
      </ActionButton>
      {sign.error && (
        <p role="alert" className="max-w-56 text-center text-sm text-destructive">
          {sign.error}
        </p>
      )}
    </>
  ) : undefined;
  const signAction = signButton ? { target: "executor" as const, node: signButton } : undefined;
  return (
    <div className="space-y-6">
      <RecordStepper status={record.status} />
      <Notice tone={record.status === "COMPLETED" ? "success" : "neutral"} role="status">
        {waitingText(record)}
      </Notice>
      <RecordDocument record={record} signAction={signAction} />
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
