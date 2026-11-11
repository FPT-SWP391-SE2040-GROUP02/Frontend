import { useState } from "react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { deathCaseService } from "../api/deathCaseService";

/**
 * Gửi mã mở gói cho người nhận qua email. Người thực thi nhập lại mã mình đang giữ (Backend kiểm rồi gửi, không lưu mã);
 * ô nhập được xóa sau khi gửi xong. Không optimistic: chỉ báo thành công sau response của BE.
 */
export function HandoverSendKey({
  caseId,
  turnId,
  onSent,
  onCancel,
}: {
  caseId: string;
  turnId: string;
  /** Gọi sau khi Backend xác nhận đã gửi; sentAt là giờ máy chủ. */
  onSent: (sentAt: string) => void;
  onCancel: () => void;
}) {
  const action = usePrivateAction();
  const [key, setKey] = useState("");
  const send = () =>
    void action.execute(
      () => deathCaseService.sendKey(caseId, turnId, key.trim()),
      (result) => {
        setKey("");
        onSent(result.sentAt);
      },
    );
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
          placeholder="XXXX-XXXX-XXXX-…"
          className="w-full rounded-xl border border-heritage-border bg-white px-3 py-2 font-mono"
          onChange={(event) => setKey(event.target.value)}
        />
      </label>
      <p className="text-heritage-muted">
        Mã được gửi riêng tới email của người nhận, tách khỏi thư mời. Hệ thống không lưu mã.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonStyles.dark}
          onClick={send}
          disabled={action.pending || key.trim().length === 0}
        >
          {action.pending ? "Đang gửi…" : "Gửi mã"}
        </button>
        <button
          type="button"
          className={buttonStyles.outline}
          onClick={onCancel}
          disabled={action.pending}
        >
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
