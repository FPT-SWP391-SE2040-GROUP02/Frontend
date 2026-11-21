import { useState } from "react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import {
  HANDOVER_NOT_STARTED_MESSAGE,
  isHandoverNotStarted,
  systemExecutorsService,
} from "@/entities/executor";
import { deathCaseService } from "../api/deathCaseService";

/**
 * Gửi mã mở gói cho người nhận qua email. Người thực thi bấm "Dùng mã đã nhận trên hệ thống" để điền mã Chủ kho
 * đã gửi (hoặc tự nhập mã đang giữ); Backend kiểm rồi gửi. Mã chỉ nằm trong ô nhập, được xóa sau khi gửi xong.
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
  /** Kho của hồ sơ; có thì cho lấy mã đã nhận trên hệ thống thay vì gõ tay. */
  vaultId?: string;
  /** Gọi sau khi Backend xác nhận đã gửi; sentAt là giờ máy chủ. */
  onSent: (sentAt: string) => void;
  onCancel: () => void;
}) {
  const action = usePrivateAction();
  const fill = usePrivateAction();
  const [key, setKey] = useState("");
  const [notStarted, setNotStarted] = useState(false);
  const busy = action.pending || fill.pending;
  const send = () =>
    void action.execute(
      () => deathCaseService.sendKey(recordId, turnId, key.trim()),
      (result) => {
        setKey("");
        onSent(result.sentAt);
      },
    );
  const fillFromSystem = (id: string) => {
    setNotStarted(false);
    void fill.execute(
      () => systemExecutorsService.getHandoverKey(id),
      (received) => setKey(received.shard),
      (error) => setNotStarted(isHandoverNotStarted(error)),
    );
  };
  return (
    <div className="space-y-3 rounded-xl border border-heritage-border bg-white/60 p-4 text-sm">
      <label className="block space-y-1">
        <span className="font-medium">Mã mở gói bạn đang giữ</span>
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
      {vaultId && (
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={busy}
          onClick={() => fillFromSystem(vaultId)}
        >
          {fill.pending ? "Đang lấy mã…" : "Dùng mã đã nhận trên hệ thống"}
        </button>
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
        <button
          type="button"
          className={buttonStyles.dark}
          onClick={send}
          disabled={busy || key.trim().length === 0}
        >
          {action.pending ? "Đang gửi…" : "Gửi mã"}
        </button>
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
