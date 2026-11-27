import { useState, type FormEvent } from "react";
import { Copy, Eye, EyeOff, KeyRound } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { buttonStyles, Chip, Panel } from "@/shared/ui/heritageKit";
import {
  HANDOVER_NOT_STARTED_MESSAGE,
  isHandoverNotStarted,
  systemExecutorsService,
} from "../api/systemExecutorsService";
import type { ExecutorHandoverKey } from "../model/systemExecutor.schema";

/**
 * Thẻ "Mã nhận" ở cổng Người thực thi. Backend chỉ cho xem mã khi kế hoạch đang bàn giao (luật sư đã chốt biên bản)
 * hoặc đã đóng; trước đó thẻ chỉ báo đang chờ, không có nút, để người dùng khỏi bấm vào chỗ chắc chắn bị từ chối.
 * Muốn xem mã phải nhập lại mật khẩu tài khoản; `verifyPassword` do trang truyền vào (Backend kiểm, sai thì ném lỗi).
 */
export function ExecutorReceivedKeyCard({
  vaultId,
  planStatus,
  verifyPassword,
}: {
  vaultId: string;
  planStatus: string;
  verifyPassword: (password: string) => Promise<void>;
}) {
  if (planStatus !== "HANDOVER_IN_PROGRESS" && planStatus !== "CLOSED") {
    return (
      <Panel title="Mã nhận" action={<Chip tone="neutral">Chờ bàn giao</Chip>}>
        <p className="text-sm leading-6 text-heritage-muted">
          Bạn sẽ xem được mã sau khi luật sư chốt phương án chia.
        </p>
      </Panel>
    );
  }
  // Tách thành phần riêng để mã đã tải bị bỏ ngay khi thẻ quay về trạng thái chờ.
  return <RevealKeyCard vaultId={vaultId} verifyPassword={verifyPassword} />;
}

/**
 * Mã chỉ tải về sau khi nhập lại mật khẩu đúng (bấm "Xem mã" rồi xác nhận), chỉ nằm trong state của thẻ (không vào cache
 * hay storage) và mất khi ẩn hoặc rời trang. Mật khẩu chỉ gửi đi kiểm, không lưu lại. Backend vẫn là nơi quyết định:
 * trả 409 HANDOVER_NOT_STARTED thì thẻ hiện câu chờ thay vì lỗi.
 */
function RevealKeyCard({
  vaultId,
  verifyPassword,
}: {
  vaultId: string;
  verifyPassword: (password: string) => Promise<void>;
}) {
  const action = usePrivateAction();
  const [key, setKey] = useState<ExecutorHandoverKey | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [notStarted, setNotStarted] = useState(false);
  const [asking, setAsking] = useState(false);
  const [password, setPassword] = useState("");

  function reveal(event: FormEvent): void {
    event.preventDefault();
    if (password.length === 0) return;
    setCopyState("idle");
    setNotStarted(false);
    void action.execute(
      async () => {
        await verifyPassword(password);
        return systemExecutorsService.getHandoverKey(vaultId);
      },
      (received) => {
        setKey(received);
        setPassword("");
        setAsking(false);
      },
      (error) => setNotStarted(isHandoverNotStarted(error)),
    );
  }

  function cancelAsking(): void {
    setAsking(false);
    setPassword("");
    action.reset();
  }

  function hide(): void {
    setKey(null);
    setCopyState("idle");
  }

  async function copy(shard: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(shard);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  let chip = <Chip tone="neutral">Đang ẩn</Chip>;
  if (key !== null) {
    chip = <Chip tone="success">Bản {key.version}</Chip>;
  }

  return (
    <Panel
      title="Mã nhận"
      action={chip}
      className="border-heritage-gold-soft/60 bg-heritage-warning-bg"
    >
      <p className="text-sm leading-6">
        Gửi mã cho người nhận để họ nhận tài sản. Không chia sẻ mã cho ai khác.
      </p>

      {key === null && !asking && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className={buttonStyles.dark} onClick={() => setAsking(true)}>
            <Eye className="size-4" aria-hidden="true" />
            Xem mã
          </button>
        </div>
      )}
      {key === null && asking && (
        <form onSubmit={reveal} className="mt-4 space-y-3 rounded-xl bg-white p-4">
          <label className="block space-y-1 text-sm font-medium" htmlFor={`reveal-pw-${vaultId}`}>
            Nhập lại mật khẩu để xem mã
            <input
              id={`reveal-pw-${vaultId}`}
              type="password"
              autoComplete="current-password"
              value={password}
              disabled={action.pending}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-heritage-border px-3 font-normal"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className={buttonStyles.dark}
              disabled={action.pending || password.length === 0}
            >
              {action.pending ? "Đang kiểm tra…" : "Xác nhận và xem mã"}
            </button>
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={action.pending}
              onClick={cancelAsking}
            >
              Hủy
            </button>
          </div>
        </form>
      )}
      {notStarted && key === null && (
        <p role="status" className="mt-3 text-sm text-heritage-muted">
          {HANDOVER_NOT_STARTED_MESSAGE}
        </p>
      )}
      {action.error && !notStarted && key === null && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {action.error}
        </p>
      )}

      {key !== null && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-white p-4">
            <p className="flex items-center gap-2 text-xs text-heritage-muted">
              <KeyRound className="size-4" aria-hidden="true" />
              Mã của tài sản {key.ownerFullName}
            </p>
            <p
              aria-label="Mã nhận"
              className="mt-2 break-all font-mono text-lg font-semibold tracking-wider"
            >
              {key.shard}
            </p>
            <p className="mt-2 text-xs text-heritage-muted">
              Cấp lúc {formatDateTime(key.reissuedAt ?? key.issuedAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={buttonStyles.dark}
              onClick={() => void copy(key.shard)}
            >
              <Copy className="size-4" aria-hidden="true" />
              Sao chép mã
            </button>
            <button type="button" className={buttonStyles.outline} onClick={hide}>
              <EyeOff className="size-4" aria-hidden="true" />
              Ẩn mã
            </button>
          </div>
          {copyState === "copied" && (
            <p role="status" className="text-sm text-heritage-success">
              Đã sao chép mã.
            </p>
          )}
          {copyState === "failed" && (
            <p role="alert" className="text-sm text-destructive">
              Trình duyệt không cho sao chép. Hãy bôi đen mã và chép tay.
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
