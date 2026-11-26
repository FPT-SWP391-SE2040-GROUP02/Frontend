import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { readVaultPinFailure, type VaultPinFailure } from "@/shared/api/vaultPin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { PIN_DIGITS, PinCodeInput } from "@/shared/ui/pin-input";
import { buttonStyles, Chip, Panel } from "@/shared/ui/heritageKit";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { executorKeyService } from "../api/executorKeyService";
import { executorKeyKeys, useExecutorKeyStatus } from "../model/useExecutorKey";

export interface ExecutorKeyCardProps {
  vaultId: string;
  title?: string;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white p-3">
      <dt className="text-sm text-heritage-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
    </div>
  );
}

/**
 * Hộp thoại đổi mã mới: xác nhận kèm mã PIN của kho (gửi qua header X-Vault-Pin). Mã mới do server tạo và giữ;
 * response chỉ có số bản nên hộp thoại không bao giờ hiện hay giữ mã.
 */
function ReissueDialog({
  vaultId,
  onClose,
  onDone,
}: {
  vaultId: string;
  onClose: () => void;
  onDone: (version: number) => void;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [pin, setPin] = useState("");
  const [pinFailure, setPinFailure] = useState<VaultPinFailure | null>(null);
  const locked = pinFailure !== null && pinFailure.code === "VAULT_PIN_LOCKED";
  const pinComplete = pin.length === PIN_DIGITS;

  function submit(): void {
    setPinFailure(null);
    void action.execute(
      () => executorKeyService.reissue(vaultId, pin),
      (status) => {
        void client.invalidateQueries({ queryKey: executorKeyKeys.status(vaultId) });
        onDone(status.version);
      },
      (error) => {
        setPin("");
        setPinFailure(readVaultPinFailure(error));
        void client.invalidateQueries({ queryKey: executorKeyKeys.status(vaultId) });
      },
    );
  }

  let errorText = action.error;
  if (pinFailure !== null) {
    errorText = pinFailure.message;
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Đổi mã mới?</DialogTitle>
          <DialogDescription>
            Mã cũ hết dùng được ngay. Hệ thống tạo mã mới và tự giữ; bạn không cần lưu hay in mã.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (pinComplete && !locked && !action.pending) {
              submit();
            }
          }}
        >
          <label htmlFor="reissue-pin" className="block text-sm font-semibold">
            Nhập mã PIN của kho (6 số)
          </label>
          <PinCodeInput
            id="reissue-pin"
            value={pin}
            placeholder="••••••"
            disabled={action.pending || locked}
            aria-invalid={errorText !== "" ? true : undefined}
            aria-describedby="reissue-pin-error"
            onValueChange={(digits) => {
              setPin(digits);
              setPinFailure(null);
              action.reset();
            }}
          />
          <p id="reissue-pin-error" role="alert" className="mt-2 min-h-5 text-sm text-destructive">
            {errorText}
          </p>
          <DialogFooter className="mt-3">
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={action.pending}
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={buttonStyles.dark}
              disabled={!pinComplete || locked || action.pending}
            >
              {action.pending ? "Đang đổi mã…" : "Đổi mã mới"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Thẻ "Mã nhận" của Chủ tài sản. Hệ thống tự tạo và giữ mã, chỉ gửi cho người nhận sau khi hồ sơ được duyệt, nên
 * thẻ không hiện mã, không có phiếu in. Chủ tài sản chỉ thấy bản đang dùng và đổi mã mới được (đòi mã PIN).
 */
export function ExecutorKeyCard({ vaultId, title = "Mã nhận" }: ExecutorKeyCardProps) {
  const query = useExecutorKeyStatus(vaultId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [changedVersion, setChangedVersion] = useState<number | null>(null);

  if (query.isPending) {
    return (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải mã nhận…
      </p>
    );
  }
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm">Không tải được trạng thái mã nhận.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }

  const status = query.data;
  let chipText = "Chưa tạo";
  let chipTone: "success" | "warning" = "warning";
  if (status.hasKey) {
    chipText = `Đã có · Bản ${status.version}`;
    chipTone = "success";
  }
  // Ngày tạo của bản đang dùng: lần đổi mã gần nhất nếu có, không thì lần tạo đầu.
  let createdAt = status.issuedAt;
  if (status.reissuedAt) {
    createdAt = status.reissuedAt;
  }

  return (
    <Panel
      title={title}
      action={<Chip tone={chipTone}>{chipText}</Chip>}
      className="border-heritage-gold-soft/60 bg-heritage-warning-bg"
    >
      <p className="text-sm leading-6">
        Hệ thống tự giữ mã và chỉ gửi cho người nhận sau khi hồ sơ được duyệt. Bạn không cần lưu hay
        in mã.
      </p>

      {!status.hasKey && (
        <p className="mt-3 text-sm leading-6 text-heritage-muted">
          Mã được tạo khi bạn ký và kích hoạt kế hoạch.
        </p>
      )}

      {status.hasKey && (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoCell label="Bản đang dùng" value={`Bản ${status.version}`} />
          <InfoCell label="Tạo lúc" value={formatDateTime(createdAt)} />
        </dl>
      )}

      {changedVersion !== null && (
        <p role="status" className="mt-3 text-sm font-medium text-heritage-success">
          Đã đổi mã. Bản đang dùng là Bản {changedVersion}.
        </p>
      )}

      {status.hasKey && !status.canIssue && (
        <p role="status" className="mt-3 text-sm text-heritage-muted">
          Kế hoạch đang bị khóa nên không đổi mã được.
        </p>
      )}
      {status.hasKey && status.canIssue && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={buttonStyles.outline}
            onClick={() => {
              setChangedVersion(null);
              setDialogOpen(true);
            }}
          >
            <KeyRound className="size-4" aria-hidden="true" />
            Đổi mã mới
          </button>
        </div>
      )}

      {dialogOpen && (
        <ReissueDialog
          vaultId={vaultId}
          onClose={() => setDialogOpen(false)}
          onDone={(version) => {
            setChangedVersion(version);
            setDialogOpen(false);
          }}
        />
      )}
    </Panel>
  );
}
