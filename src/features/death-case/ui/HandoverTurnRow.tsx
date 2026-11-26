import { useId, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ExecutorReceiptSignButton } from "@/entities/handoverRecord";
import { HANDOVER_NOT_STARTED_MESSAGE } from "@/entities/executor";
import { deathCaseService } from "../api/deathCaseService";
import { cn } from "cn";
import { buttonStyles, formatDateTime, Initial } from "@/shared/ui/heritageKit";
import type { TurnProgress, TurnSegment, SegmentState, TurnTone } from "../model/executorTurns";
import {
  canMailHandoverKey,
  canSignReceipt,
  type HandoverProgressTurn,
} from "../model/handoverProgress.schema";
import { useSendHandoverKey } from "../model/useSendHandoverKey";
import { ActionButton } from "@/shared/ui/ActionButton";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";

/** Đoạn thanh: xanh đậm (xong), vàng (đang chờ), xám nhạt (chưa tới), xám đậm (dừng). */
const SEGMENT_COLORS: Record<SegmentState, string> = {
  done: "bg-heritage-primary-hover",
  current: "bg-heritage-gold-soft",
  pending: "bg-heritage-border",
  stopped: "bg-heritage-subtle",
};

const STEP_TEXT_COLORS: Record<SegmentState, string> = {
  done: "text-heritage-success",
  current: "text-heritage-warning",
  pending: "text-heritage-muted",
  stopped: "text-heritage-muted",
};

const HEADLINE_COLORS: Record<TurnTone, string> = {
  success: "text-heritage-success",
  warning: "text-heritage-warning",
  neutral: "text-heritage-muted",
};

const STATE_WORDS: Record<SegmentState, string> = {
  done: "xong",
  current: "đang chờ",
  pending: "chưa tới",
  stopped: "dừng ở đây",
};

/** Thanh 5 đoạn của một lượt. Mỗi đoạn có chữ ẩn cho trình đọc màn hình (tên bước và trạng thái). */
function StepBar({ segments }: { segments: TurnSegment[] }) {
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label="Các bước của người nhận">
      {segments.map((segment) => (
        <li
          key={segment.key}
          aria-current={segment.state === "current" ? "step" : undefined}
          data-state={segment.state}
          className={cn("h-2.5 rounded-full", SEGMENT_COLORS[segment.state])}
        >
          <span className="sr-only">
            {segment.label}: {STATE_WORDS[segment.state]}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Hàng ngang dưới thanh: tên bước và giờ, thẳng cột với 5 đoạn (hoặc 2 cột cho lượt từ chối). */
function StepTimes({ columns }: { columns: TurnSegment[] }) {
  return (
    <ol
      aria-label="Giờ từng bước"
      className="grid gap-1.5 text-sm"
      style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
    >
      {columns.map((column) => (
        <li key={column.key} className="min-w-0">
          <p className={cn("font-semibold leading-snug", STEP_TEXT_COLORS[column.state])}>
            {column.label}
          </p>
          <p className="mt-0.5 text-heritage-muted tabular-nums">{column.timeText}</p>
        </li>
      ))}
    </ol>
  );
}

function recipientName(turn: HandoverProgressTurn): string {
  if (turn.beneficiaryFullName) return turn.beneficiaryFullName;
  return `Người nhận CCCD ${turn.beneficiaryCitizenId}`;
}

/** Ba ô nhỏ viền mảnh: Thông tin liên hệ, Tài sản, Biên bản. */
function DetailBoxes({ turn, progress }: { turn: HandoverProgressTurn; progress: TurnProgress }) {
  const declined = progress.group === "declined" || progress.group === "ended";
  let assetText = `${turn.downloadedItems}/${turn.totalItems} đã tải`;
  if (declined) assetText = "Không bàn giao";
  // Chữ ký của người nhận trên biên bản bàn giao chung (luật sư lập, ba bên ký) và lúc lượt này được mở quyền tải.
  const paperLines: ReactNode[] = [];
  let signedText = "Người nhận chưa ký";
  if (turn.recipientSignedAt) {
    signedText = `Người nhận đã ký lúc ${formatDateTime(turn.recipientSignedAt)}`;
  }
  paperLines.push(
    <p key="signed" className="text-sm">
      {signedText}
    </p>,
  );
  if (turn.documentApprovedAt) {
    const openedText = `Được mở quyền tải lúc ${formatDateTime(turn.documentApprovedAt)}`;
    paperLines.push(
      <p key="opened" className="mt-1 text-sm">
        {openedText}
      </p>,
    );
  }
  if (turn.receivedAllAt) {
    paperLines.push(
      <p key="received" className="mt-1 text-sm">
        {`Phiếu giao nhận: người nhận ký lúc ${formatDateTime(turn.receivedAllAt)}`}
      </p>,
    );
  }
  if (turn.receiptExecutorSignedAt) {
    paperLines.push(
      <p key="delivered" className="mt-1 text-sm">
        {`Phiếu giao nhận: bạn ký lúc ${formatDateTime(turn.receiptExecutorSignedAt)}`}
      </p>,
    );
  }
  if (turn.receiptIssueNote && turn.receiptIssueAt) {
    paperLines.push(
      <p key="issue" className="mt-1 break-words text-sm text-heritage-danger">
        {`Người nhận báo lúc ${formatDateTime(turn.receiptIssueAt)}: ${turn.receiptIssueNote}`}
      </p>,
    );
  }
  const boxClass = "min-w-0 rounded-xl border border-heritage-border bg-white/60 p-3 text-sm";
  const titleClass = "mb-2 text-sm font-semibold text-heritage-muted";
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <section aria-label="Thông tin liên hệ" className={boxClass}>
        <h4 className={titleClass}>Thông tin liên hệ</h4>
        <p>
          <span className="text-heritage-muted">Số điện thoại: </span>
          {turn.beneficiaryPhone ?? "Chưa có"}
        </p>
        <p className="mt-1 break-all">
          <span className="text-heritage-muted">Email: </span>
          {turn.beneficiaryEmail ?? "Chưa có"}
        </p>
      </section>
      <section aria-label="Tài sản" className={boxClass}>
        <h4 className={titleClass}>Tài sản</h4>
        <p className="font-medium">{assetText}</p>
        {!declined && turn.items.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-heritage-muted">
            {turn.items.map((item) => {
              let downloadText = "chưa tải";
              if (item.downloaded && item.firstDownloadedAt) {
                downloadText = `đã tải ${formatDateTime(item.firstDownloadedAt)}`;
              }
              return (
                <li key={item.itemId} className="break-words">
                  {item.name} · {downloadText}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 flex items-start gap-1.5 text-sm text-heritage-muted">
          <Lock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
          Chỉ thấy tên và trạng thái tải, không có nội dung.
        </p>
      </section>
      <section aria-label="Biên bản" className={boxClass}>
        <h4 className={titleClass}>Biên bản</h4>
        {paperLines}
      </section>
    </div>
  );
}

/**
 * Một dòng người nhận (một gói cho một người nhận) trên trang Bàn giao: tên + gói, thanh 5 đoạn kèm "Bước hiện tại",
 * và nút thao tác. Bấm "Chi tiết" mở ngay dưới dòng hàng giờ từng bước và ba ô thông tin.
 * Dòng có việc Người thực thi cần làm được tô nổi (nền vàng rất nhạt, vạch vàng đậm bên trái).
 */
export function HandoverTurnRow({
  recordId,
  vaultId,
  turn,
  progress,
}: {
  recordId: string;
  vaultId: string;
  turn: HandoverProgressTurn;
  progress: TurnProgress;
}) {
  const detailId = useId();
  const [expanded, setExpanded] = useState(false);
  const canMailKey = canMailHandoverKey(turn);
  const mailKey = useSendHandoverKey({ recordId, turnId: turn.turnId, vaultId });
  const client = useQueryClient();
  const receipt = usePrivateAction();
  const receiptSigned = useSuccessHold();
  const name = recipientName(turn);
  const highlighted = progress.needsAction;
  // Nút ký chỉ nằm trong khung "Xem và ký phiếu giao nhận", ngay ô chữ ký "Bên giao"; lỗi ký hiện ngay dưới nút vì cửa sổ che trang.
  const signNode = (
    <>
      <ActionButton
        className={buttonStyles.dark}
        pending={receipt.pending}
        done={receiptSigned.done}
        pendingLabel="Đang ký…"
        doneLabel="Đã ký"
        onClick={() =>
          void receipt.execute(
            () => receiptSigned.hold(() => deathCaseService.signReceipt(recordId, turn.turnId)),
            () => {
              void client.invalidateQueries({ queryKey: ["death-case"] });
              void client.invalidateQueries({ queryKey: ["handover-record"] });
              void client.invalidateQueries({ queryKey: ["executor-vaults"] });
            },
          )
        }
      >
        Ký phiếu giao nhận
      </ActionButton>
      {receipt.error && (
        <p role="alert" className="max-w-56 text-center text-sm text-destructive">
          {receipt.error}
        </p>
      )}
    </>
  );
  return (
    <li
      aria-label={`${name}, ${turn.containerName}`}
      data-needs-action={highlighted ? "true" : undefined}
      className={cn(
        "rounded-2xl border bg-heritage-surface p-4",
        highlighted
          ? "border-heritage-gold-soft border-l-4 border-l-heritage-gold bg-heritage-gold-light"
          : "border-heritage-border",
      )}
    >
      <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_11rem]">
        <div className="flex min-w-0 items-center gap-3">
          <Initial name={turn.beneficiaryFullName ?? "?"} className="size-10 text-sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{name}</p>
            <p className="truncate text-sm text-heritage-muted">{turn.containerName}</p>
          </div>
        </div>
        <div className="min-w-0 space-y-2">
          <StepBar segments={progress.segments} />
          <p className="text-sm leading-5">
            <span className="sr-only">Bước hiện tại: </span>
            <strong className={HEADLINE_COLORS[progress.tone]}>{progress.headline}</strong>
            <span className="text-heritage-muted"> · {progress.detail}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {canMailKey && (
            <button
              type="button"
              className={buttonStyles.dark}
              disabled={mailKey.pending}
              onClick={mailKey.send}
            >
              {mailKey.pending ? "Đang gửi…" : "Gửi mã qua email"}
            </button>
          )}
          {canSignReceipt(turn) && (
            <ExecutorReceiptSignButton vaultId={vaultId} turnId={turn.turnId} signNode={signNode} />
          )}
          <button
            type="button"
            className={cn(buttonStyles.outline, "min-h-10 px-4")}
            aria-expanded={expanded}
            aria-controls={detailId}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Thu gọn" : "Chi tiết"}
          </button>
        </div>
      </div>
      {mailKey.notStarted && (
        <p role="status" className="mt-3 text-sm text-heritage-muted">
          {HANDOVER_NOT_STARTED_MESSAGE}
        </p>
      )}
      {mailKey.error && !mailKey.notStarted && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {mailKey.error}
        </p>
      )}
      {mailKey.sentAt && (
        <p role="status" className="mt-3 text-sm">
          Đã gửi mã cho người nhận lúc {formatDateTime(mailKey.sentAt)}.
        </p>
      )}
      {expanded && (
        <div id={detailId} className="mt-4 space-y-4 border-t border-heritage-border pt-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_11rem]">
            <div className="hidden lg:block" aria-hidden="true" />
            <StepTimes columns={progress.detailColumns} />
            <div className="hidden lg:block" aria-hidden="true" />
          </div>
          <DetailBoxes turn={turn} progress={progress} />
        </div>
      )}
    </li>
  );
}
