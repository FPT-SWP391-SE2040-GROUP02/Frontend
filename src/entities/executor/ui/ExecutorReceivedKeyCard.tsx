import { useState } from "react";
import { Copy, Eye, EyeOff, KeyRound } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { buttonStyles, Chip, Panel } from "@/shared/ui/heritageKit";
import { systemExecutorsService } from "../api/systemExecutorsService";
import type { ExecutorHandoverKey } from "../model/systemExecutor.schema";

/**
 * Thẻ "Mã mở gói bàn giao" ở cổng Người thực thi: Chủ kho tạo mã thì mã được gửi tới đây trên hệ thống.
 * Mã chỉ tải về khi bấm "Xem mã", chỉ nằm trong state của thẻ (không vào cache hay storage) và mất khi ẩn hoặc rời trang.
 */
export function ExecutorReceivedKeyCard({ vaultId }: { vaultId: string }) {
  const action = usePrivateAction();
  const [key, setKey] = useState<ExecutorHandoverKey | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  function reveal(): void {
    setCopyState("idle");
    void action.execute(() => systemExecutorsService.getHandoverKey(vaultId), setKey);
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
    <Panel title="Mã mở gói bàn giao" action={chip} className="border-[#E0C486]/60 bg-[#FBF3DE]">
      <p className="text-sm leading-6">
        Chủ kho gửi mã này cho bạn ngay trên hệ thống. Khi bàn giao, bạn gửi mã cho người nhận để họ
        mở gói. Không chia sẻ mã cho ai khác.
      </p>

      {key === null && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={buttonStyles.gold}
            disabled={action.pending}
            onClick={reveal}
          >
            <Eye className="size-4" aria-hidden="true" />
            {action.pending ? "Đang tải mã…" : "Xem mã"}
          </button>
        </div>
      )}
      {action.error && key === null && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {action.error}
        </p>
      )}

      {key !== null && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-white p-4">
            <p className="flex items-center gap-2 text-xs text-heritage-muted">
              <KeyRound className="size-4" aria-hidden="true" />
              Mã của kho {key.ownerFullName}
            </p>
            <p
              aria-label="Mã mở gói"
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
            <p role="status" className="text-sm text-[#1F7A55]">
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
