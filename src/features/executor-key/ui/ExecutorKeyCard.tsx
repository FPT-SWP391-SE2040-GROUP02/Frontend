import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { buttonStyles, Chip, Notice, Panel } from "@/shared/ui/heritageKit";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { executorKeyService } from "../api/executorKeyService";
import { executorKeyKeys, useExecutorKeyStatus } from "../model/useExecutorKey";

type Step = "closed" | "confirm" | "reveal";

/**
 * Thẻ "Mảnh khóa của Người thực hiện" ở màn Người tin cậy của Chủ kho. Chủ kho nhận mảnh khóa và tự đưa trực tiếp cho
 * Người thực hiện; nếu họ quên hoặc mất thì bấm "Quên khóa" để cấp mảnh mới, mảnh cũ hết hiệu lực ngay.
 * Mảnh gốc chỉ hiện một lần trong hộp thoại, không lưu vào cache hay storage.
 */
export function ExecutorKeyCard({ vaultId }: { vaultId: string }) {
  const query = useExecutorKeyStatus(vaultId);
  const client = useQueryClient();
  const action = usePrivateAction();
  const [step, setStep] = useState<Step>("closed");
  const [shard, setShard] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [handedOver, setHandedOver] = useState(false);

  if (query.isPending) {
    return (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải mảnh khóa…
      </p>
    );
  }
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm">Không tải được trạng thái mảnh khóa.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }

  const status = query.data;
  const reissue = status.hasKey;

  const close = () => {
    setStep("closed");
    setShard(null);
    setCopied(false);
    setHandedOver(false);
    action.reset();
  };

  const run = () =>
    void action.execute(
      () => (reissue ? executorKeyService.reissue(vaultId) : executorKeyService.issue(vaultId)),
      (result) => {
        setShard(result.shard);
        setStep("reveal");
        void client.invalidateQueries({ queryKey: executorKeyKeys.status(vaultId) });
      },
    );

  const copy = () => {
    if (!shard) return;
    void navigator.clipboard.writeText(shard).then(() => setCopied(true));
  };

  return (
    <Panel
      title="Mảnh khóa của Người thực hiện"
      action={
        <Chip tone={status.hasKey ? "success" : "warning"}>
          {status.hasKey ? `Đã cấp (bản ${status.version})` : "Chưa cấp"}
        </Chip>
      }
    >
      <p className="text-sm leading-6 text-heritage-muted">
        Mảnh khóa là một nửa mã mở gói tài sản. Bạn nhận mảnh này và đưa trực tiếp cho Người thực
        hiện; nửa còn lại nằm trong email gửi người nhận. Hệ thống không lưu mảnh gốc nên không đọc
        lại được.
      </p>
      {status.issuedAt && (
        <p className="mt-2 text-xs text-heritage-muted">
          Cấp lúc {formatDateTime(status.issuedAt)}
          {status.reissuedAt ? ` · cấp lại lúc ${formatDateTime(status.reissuedAt)}` : ""}
        </p>
      )}
      {!status.canIssue && (
        <p role="status" className="mt-3 text-sm text-heritage-muted">
          Kế hoạch đang bị khóa nên không cấp hoặc cấp lại được nữa.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={reissue ? buttonStyles.outline : buttonStyles.gold}
          disabled={!status.canIssue || action.pending}
          onClick={() => {
            action.reset();
            setStep("confirm");
          }}
        >
          <KeyRound className="size-4" aria-hidden="true" />
          {reissue ? "Quên khóa? Cấp lại" : "Tạo mảnh khóa"}
        </button>
      </div>

      {step === "confirm" && (
        <Dialog open onOpenChange={(open) => !open && !action.pending && close()}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{reissue ? "Cấp lại mảnh khóa?" : "Tạo mảnh khóa?"}</DialogTitle>
              <DialogDescription>
                {reissue
                  ? "Mảnh cũ hết hiệu lực ngay. Người thực hiện phải dùng mảnh mới bạn đưa lần này."
                  : "Mảnh khóa chỉ hiện một lần. Hãy chuẩn bị đưa trực tiếp cho Người thực hiện."}
              </DialogDescription>
            </DialogHeader>
            {action.error && (
              <p role="alert" className="text-sm text-destructive">
                {action.error}
              </p>
            )}
            <DialogFooter>
              <button
                type="button"
                className={buttonStyles.outline}
                disabled={action.pending}
                onClick={close}
              >
                Hủy
              </button>
              <button
                type="button"
                className={buttonStyles.gold}
                disabled={action.pending}
                onClick={run}
              >
                {action.pending ? "Đang tạo…" : reissue ? "Cấp lại" : "Tạo mảnh khóa"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {step === "reveal" && shard && (
        <Dialog open onOpenChange={() => undefined}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Mảnh khóa của bạn</DialogTitle>
              <DialogDescription>
                Chỉ hiện một lần. Đưa trực tiếp cho Người thực hiện rồi mới đóng.
              </DialogDescription>
            </DialogHeader>
            <p
              aria-label="Mảnh khóa"
              className="break-all rounded-xl bg-[#ECE8DB] p-4 text-center font-mono text-lg font-semibold tracking-wider"
            >
              {shard}
            </p>
            <Notice tone="warning" title="Không gửi qua email hay tin nhắn công khai">
              Ai có mảnh này và mảnh trong email người nhận thì mở được gói tài sản.
            </Notice>
            <button type="button" className={buttonStyles.outline} onClick={copy}>
              <Copy className="size-4" aria-hidden="true" />
              {copied ? "Đã chép" : "Chép mảnh khóa"}
            </button>
            <label className="flex min-h-11 items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                className="mt-1 size-5"
                checked={handedOver}
                onChange={(event) => setHandedOver(event.target.checked)}
              />
              Tôi đã đưa mảnh khóa này cho Người thực hiện.
            </label>
            <DialogFooter>
              <button
                type="button"
                className={buttonStyles.gold}
                disabled={!handedOver}
                onClick={close}
              >
                Đóng
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Panel>
  );
}
