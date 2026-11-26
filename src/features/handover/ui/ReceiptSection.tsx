import { useState } from "react";
import type { z } from "zod";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";
import type { handoverTurnSchema } from "../model/handover.schema";
import { useHandoverAction } from "../model/useHandoverAction";
import { ActionButton } from "@/shared/ui/ActionButton";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";

type Turn = z.infer<typeof handoverTurnSchema>;

/** Ô báo tài sản thiếu hoặc sai; báo rồi vẫn ký phiếu được khi đã nhận đủ. */
function IssueForm({ turn, onChanged }: { turn: Turn; onChanged: () => void }) {
  const action = useHandoverAction();
  const [note, setNote] = useState("");
  return (
    <div className="space-y-2 border-t border-heritage-border pt-3">
      <label className="block space-y-1 text-sm font-medium">
        Tài sản thiếu hoặc sai
        <textarea
          className="min-h-20 w-full rounded-xl border border-heritage-border bg-white p-3 font-normal"
          maxLength={1000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <button
        type="button"
        className={buttonStyles.outline}
        disabled={action.pending || note.trim().length === 0}
        onClick={() =>
          void action.execute(
            () => handoverService.reportReceiptIssue(turn.id, note.trim()),
            () => {
              setNote("");
              onChanged();
            },
          )
        }
      >
        Báo thiếu hoặc sai
      </button>
      {turn.receiptIssueNote && turn.receiptIssueAt && (
        <p role="status" className="text-sm">
          {`Bạn đã báo lúc ${formatDateTime(turn.receiptIssueAt)}: ${turn.receiptIssueNote}`}
        </p>
      )}
      {action.error && (
        <p role="alert" className="text-sm text-heritage-danger">
          {action.error}
        </p>
      )}
    </div>
  );
}

/** Phiếu giao nhận phía người nhận: tải và kiểm tra xong thì ký bên nhận, hoặc báo thiếu, sai. */
export function ReceiptSection({ turn, onChanged }: { turn: Turn; onChanged: () => void }) {
  const action = useHandoverAction();
  const signed = useSuccessHold();
  const missing = turn.items.filter((item) => !item.downloaded).length;
  if (turn.receivedAllAt) {
    let executorText = "Đang chờ Người thực thi ký bên giao.";
    if (turn.receiptExecutorSignedAt) {
      executorText = `Người thực thi đã ký lúc ${formatDateTime(turn.receiptExecutorSignedAt)}. Việc giao nhận đã hoàn tất.`;
    }
    return (
      <div role="status" className="space-y-1 text-sm">
        <p>Bạn đã xác nhận nhận đủ lúc {formatDateTime(turn.receivedAllAt)}.</p>
        <p>{executorText}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-heritage-muted">
        Tải và kiểm tra các mục ở bước 6B phía trên, rồi ký phiếu giao nhận. Ký rồi là bạn xác nhận
        đã nhận đủ và tự chịu trách nhiệm quản lý tài sản.
      </p>
      {missing > 0 && (
        <p role="status" className="text-sm font-medium text-heritage-warning">
          Còn {missing} mục chưa tải. Tải hết rồi mới xác nhận được.
        </p>
      )}
      <ActionButton
        className={buttonStyles.dark}
        disabled={action.pending || missing > 0}
        onClick={() =>
          void action.execute(
            () => signed.hold(() => handoverService.confirmReceivedAll(turn.id)),
            onChanged,
          )
        }
        pending={action.pending}
        done={signed.done}
        pendingLabel="Đang ký…"
        doneLabel="Đã ký"
      >
        Tôi đã nhận đủ, ký phiếu
      </ActionButton>
      {action.error && (
        <p role="alert" className="text-sm text-heritage-danger">
          {action.error}
        </p>
      )}
      <IssueForm turn={turn} onChanged={onChanged} />
    </div>
  );
}
