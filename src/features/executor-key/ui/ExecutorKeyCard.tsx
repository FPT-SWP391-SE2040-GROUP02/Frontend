import { useState, type ReactNode } from "react";
import { KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { buttonStyles, Chip, Panel } from "@/shared/ui/heritageKit";
import { formatDateTime } from "@/shared/lib/dateFormat";
import type { ExecutorKeyIssued } from "../model/executorKey.schema";
import { useExecutorKeyStatus } from "../model/useExecutorKey";
import { useExecutorKeyIssue } from "../model/useExecutorKeyIssue";
import type { HandoverSlipContext } from "./HandoverSlip";
import { ExecutorKeyReveal } from "./ExecutorKeyReveal";

type Step = "closed" | "confirm" | "reveal";

export interface ExecutorKeyCardProps {
  vaultId: string;
  /** Thông tin in lên phiếu; do widget ghép từ người dùng đang đăng nhập, kho và Người thực thi chính. */
  slip: HandoverSlipContext;
  title?: string;
  /** false khi nơi dùng đã có nút "Tạo mã mở gói" riêng hoặc chưa được phép tạo (kế hoạch còn nháp). */
  showIssueButton?: boolean;
  /** Nội dung hộp trắng khi chưa có mã (lý do chưa có, lối đi tiếp). Bỏ trống thì dùng câu mặc định. */
  emptyState?: ReactNode;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white p-3">
      <dt className="text-xs text-heritage-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
    </div>
  );
}

/**
 * Thẻ "Mã mở gói" của Chủ kho. Mã là một chuỗi duy nhất cho mọi gói; Chủ kho tải phiếu và gửi riêng cho
 * Người thực thi. Mất phiếu thì bấm "Đổi mã mới": mã cũ hết dùng được ngay.
 * Mã gốc chỉ hiện một lần trong hộp thoại, không lưu vào cache hay storage.
 */
export function ExecutorKeyCard({
  vaultId,
  slip,
  title = "Mã mở gói",
  showIssueButton = true,
  emptyState,
}: ExecutorKeyCardProps) {
  const query = useExecutorKeyStatus(vaultId);
  const issuer = useExecutorKeyIssue(vaultId);
  const [step, setStep] = useState<Step>("closed");
  const [issued, setIssued] = useState<ExecutorKeyIssued | null>(null);

  if (query.isPending) {
    return (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải mã mở gói…
      </p>
    );
  }
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm">Không tải được trạng thái mã mở gói.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }

  const status = query.data;
  const reissue = status.hasKey;

  function close(): void {
    setStep("closed");
    setIssued(null);
    issuer.reset();
  }

  function runIssue(): void {
    let mode: "issue" | "reissue" = "issue";
    if (reissue) {
      mode = "reissue";
    }
    void issuer.run(mode, (result) => {
      setIssued(result);
      setStep("reveal");
    });
  }

  let chipText = "Chưa có";
  let chipTone: "success" | "warning" = "warning";
  if (status.hasKey) {
    chipText = `Đã có · Bản ${status.version}`;
    chipTone = "success";
  }
  let buttonStyle = buttonStyles.gold;
  let buttonText = "Tạo mã mở gói";
  let confirmTitle = "Tạo mã mở gói?";
  let confirmText = "Mã chỉ hiện một lần. Hãy chuẩn bị tải phiếu và gửi riêng cho Người thực thi.";
  let confirmButtonText = "Tạo mã mở gói";
  if (reissue) {
    buttonStyle = buttonStyles.outline;
    buttonText = "Đổi mã mới";
    confirmTitle = "Đổi mã mới?";
    confirmText = "Mã cũ hết dùng được ngay. Người thực thi phải dùng mã mới bạn gửi lần này.";
    confirmButtonText = "Đổi mã mới";
  }
  if (issuer.pending) {
    confirmButtonText = "Đang tạo…";
  }
  const showButton = reissue || showIssueButton;

  // Ngày tạo của bản đang dùng: lần đổi mã gần nhất nếu có, không thì lần tạo đầu.
  let createdAt = status.issuedAt;
  if (status.reissuedAt) {
    createdAt = status.reissuedAt;
  }

  let revealSlipDate: string | null | undefined = null;
  if (issued !== null) {
    revealSlipDate = issued.issuedAt;
    if (issued.reissuedAt) {
      revealSlipDate = issued.reissuedAt;
    }
  }

  let emptyContent: ReactNode = emptyState;
  if (emptyState === undefined) {
    emptyContent = <p>Chưa có mã. Mã chỉ hiện một lần lúc tạo, kèm phiếu để tải về.</p>;
  }

  return (
    <Panel
      title={title}
      action={<Chip tone={chipTone}>{chipText}</Chip>}
      className="border-[#E0C486]/60 bg-[#FBF3DE]"
    >
      <p className="text-sm leading-6">
        Một mã cho cả kho. Người nhận cần mã này để mở tài sản; bạn trao cho Người thực thi giữ.
      </p>

      {!status.hasKey && (
        <div className="mt-4 space-y-3 rounded-xl bg-white p-4 text-sm leading-6">
          {emptyContent}
        </div>
      )}

      {status.hasKey && (
        <>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoCell label="Bản đang dùng" value={`Bản ${status.version}`} />
            <InfoCell label="Tạo lúc" value={formatDateTime(createdAt)} />
          </dl>
          <p className="mt-4 text-sm leading-6 text-heritage-muted">
            Không xem lại được mã cũ. Lỡ mất phiếu thì đổi mã mới; mã cũ hết dùng được ngay.
          </p>
        </>
      )}

      {!status.canIssue && (
        <p role="status" className="mt-3 text-sm text-heritage-muted">
          Kế hoạch đang bị khóa nên không đổi mã được.
        </p>
      )}
      {status.canIssue && showButton && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={buttonStyle}
            disabled={issuer.pending}
            onClick={() => {
              issuer.reset();
              setStep("confirm");
            }}
          >
            <KeyRound className="size-4" aria-hidden="true" />
            {buttonText}
          </button>
        </div>
      )}

      {step === "confirm" && (
        <Dialog open onOpenChange={(open) => !open && !issuer.pending && close()}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{confirmTitle}</DialogTitle>
              <DialogDescription>{confirmText}</DialogDescription>
            </DialogHeader>
            {issuer.error && (
              <p role="alert" className="text-sm text-destructive">
                {issuer.error}
              </p>
            )}
            <DialogFooter>
              <button
                type="button"
                className={buttonStyles.outline}
                disabled={issuer.pending}
                onClick={close}
              >
                Hủy
              </button>
              <button
                type="button"
                className={buttonStyles.gold}
                disabled={issuer.pending}
                onClick={runIssue}
              >
                {confirmButtonText}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {step === "reveal" && issued !== null && (
        <Dialog open onOpenChange={() => undefined}>
          <DialogContent className="sm:max-w-3xl" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Phiếu bàn giao mã mở gói</DialogTitle>
              <DialogDescription>
                Mã chỉ hiện một lần. Tải phiếu hoặc chép mã rồi mới hoàn tất.
              </DialogDescription>
            </DialogHeader>
            <ExecutorKeyReveal
              slip={{
                ownerName: slip.ownerName,
                vaultName: slip.vaultName,
                executorEmail: slip.executorEmail,
                issuedAt: revealSlipDate,
                version: issued.version,
                shard: issued.shard,
              }}
              onDone={close}
            />
          </DialogContent>
        </Dialog>
      )}
    </Panel>
  );
}
