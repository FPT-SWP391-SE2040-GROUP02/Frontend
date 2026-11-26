import { useEffect, useState } from "react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";
import { ActionButton } from "@/shared/ui/ActionButton";
import {
  HANDOVER_NOT_STARTED_MESSAGE,
  isHandoverNotStarted,
  systemExecutorsService,
} from "@/entities/executor";
import { deathCaseService } from "../api/deathCaseService";

/**
 * Gửi mã nhận cho người nhận qua email. Mở khung là mã Chủ tài sản đã gửi trên hệ thống hiện sẵn trong ô (chưa có thì
 * Người thực thi tự nhập mã đang giữ); Backend kiểm rồi gửi. Mã chỉ nằm trong ô nhập, được xóa sau khi gửi xong.
 * Không optimistic: chỉ báo thành công sau response của BE.
 */
export function HandoverSendKey({
  recordId,
  turnId,
  vaultId,
  onSent,
  onCancel,
}: {
  recordId: string;
  turnId: string;
  /** Kho của hồ sơ; có thì tự điền mã đã nhận trên hệ thống. */
  vaultId?: string;
  /** Gọi sau khi Backend xác nhận đã gửi; sentAt là giờ máy chủ. */
  onSent: (sentAt: string) => void;
  onCancel: () => void;
}) {
  const action = usePrivateAction();
  const fill = usePrivateAction();
  const sent = useSuccessHold();
  const [key, setKey] = useState("");
  const [notStarted, setNotStarted] = useState(false);
  const busy = action.pending;
  const send = () =>
    void action.execute(
      () => sent.hold(() => deathCaseService.sendKey(recordId, turnId, key.trim())),
      (result) => {
        setKey("");
        onSent(result.sentAt);
      },
    );
  // Lấy mã một lần khi mở khung. Không ghi đè mã người dùng đã tự gõ trong lúc chờ.
  useEffect(() => {
    if (!vaultId) return;
    void fill.execute(
      () => systemExecutorsService.getHandoverKey(vaultId),
      (received) => setKey((typed) => typed || received.shard),
      (error) => setNotStarted(isHandoverNotStarted(error)),
    );
    // fill đổi mỗi lần render; chỉ cần chạy lại khi đổi kho.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaultId]);
  return (
    <div className="space-y-3 rounded-xl border border-heritage-border bg-white/60 p-4 text-sm">
      <label className="block space-y-1">
        <span className="font-medium">Mã nhận bạn đang giữ</span>
        <input
          type="text"
          value={key}
          autoComplete="off"
          spellCheck={false}
          maxLength={80}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          className="w-full rounded-xl border border-heritage-border bg-white px-3 py-2 font-mono"
          onChange={(event) => setKey(event.target.value)}
        />
      </label>
      {fill.pending && (
        <p role="status" className="text-heritage-muted">
          Đang lấy mã…
        </p>
      )}
      {notStarted && (
        <p role="status" className="text-heritage-muted">
          {HANDOVER_NOT_STARTED_MESSAGE}
        </p>
      )}
      {fill.error && !notStarted && (
        <p role="alert" className="text-sm text-destructive">
          {fill.error}
        </p>
      )}
      <p className="text-heritage-muted">
        Mã được gửi riêng tới email của người nhận, tách khỏi thư mời.
      </p>
      <div className="flex flex-wrap gap-2">
        <ActionButton
          className={buttonStyles.dark}
          onClick={send}
          pending={busy}
          done={sent.done}
          pendingLabel="Đang gửi…"
          doneLabel="Đã gửi"
          disabled={key.trim().length === 0}
        >
          Gửi mã
        </ActionButton>
        <button type="button" className={buttonStyles.outline} onClick={onCancel} disabled={busy}>
          Hủy
        </button>
      </div>
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
    </div>
  );
}
