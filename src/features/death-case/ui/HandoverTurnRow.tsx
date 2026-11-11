import { useId, useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "cn";
import { buttonStyles, formatDateTime, Initial } from "@/shared/ui/heritageKit";
import type { TurnProgress, TurnSegment, SegmentState, TurnTone } from "../model/executorTurns";
import {
  KEY_MAILABLE_TURN_STATUSES,
  type HandoverProgressTurn,
} from "../model/handoverProgress.schema";
import { HandoverPaper } from "./HandoverPaper";
import { HandoverSendKey } from "./HandoverSendKey";

/** Đoạn thanh: xanh đậm (xong), vàng (đang chờ), xám nhạt (chưa tới), xám đậm (dừng). */
const SEGMENT_COLORS: Record<SegmentState, string> = {
  done: "bg-[#1F5D46]",
  current: "bg-[#E0C486]",
  pending: "bg-[#E5E1D3]",
  stopped: "bg-[#8E8B80]",
};

const STEP_TEXT_COLORS: Record<SegmentState, string> = {
  done: "text-[#1F7A55]",
  current: "text-[#7A5B25]",
  pending: "text-heritage-muted",
  stopped: "text-[#4D4D4B]",
};

const HEADLINE_COLORS: Record<TurnTone, string> = {
  success: "text-[#1F7A55]",
  warning: "text-[#7A5B25]",
  neutral: "text-[#4D4D4B]",
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
      className="grid gap-1.5 text-xs"
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
  return `Người nhận CCCD ***${turn.beneficiaryCitizenIdLast4}`;
}

/** Ba ô nhỏ viền mảnh: Thông tin liên hệ, Tài sản, Biên bản. */
function DetailBoxes({
  caseId,
  turn,
  progress,
}: {
  caseId: string;
  turn: HandoverProgressTurn;
  progress: TurnProgress;
}) {
  const [paperOpen, setPaperOpen] = useState(false);
  const declined = progress.group === "declined" || progress.group === "ended";
  let assetText = `${turn.downloadedItems}/${turn.totalItems} đã tải`;
  if (declined) assetText = "Không bàn giao";
  let paper;
  if (turn.status === "HANDOVER_COMMITTED") {
    paper = (
      <HandoverPaper
        caseId={caseId}
        turnId={turn.turnId}
        label="biên bản đồng ý"
        buttonLabel="Xem biên bản đồng ý"
        onOpenChange={setPaperOpen}
      />
    );
  } else if (turn.status === "DECLINED") {
    paper = (
      <HandoverPaper
        caseId={caseId}
        turnId={turn.turnId}
        label="văn bản từ chối"
        buttonLabel="Xem văn bản từ chối"
        onOpenChange={setPaperOpen}
      />
    );
  } else {
    paper = <p className="text-sm">Chưa có</p>;
  }
  const boxClass = "min-w-0 rounded-xl border border-heritage-border bg-white/60 p-3 text-sm";
  const titleClass = "mb-2 text-xs font-semibold text-heritage-muted";
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
          <ul className="mt-2 space-y-1 text-xs text-heritage-muted">
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
        <p className="mt-2 flex items-start gap-1.5 text-xs text-heritage-muted">
          <Lock className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
          Chỉ thấy tên và trạng thái tải, không có nội dung.
        </p>
      </section>
      <section aria-label="Biên bản" className={cn(boxClass, paperOpen && "sm:col-span-3")}>
        <h4 className={titleClass}>Biên bản</h4>
        {paper}
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
  caseId,
  turn,
  progress,
}: {
  caseId: string;
  turn: HandoverProgressTurn;
  progress: TurnProgress;
}) {
  const detailId = useId();
  const [expanded, setExpanded] = useState(false);
  const [keyFormOpen, setKeyFormOpen] = useState(false);
  const [keySentAt, setKeySentAt] = useState<string | null>(null);
  const canMailKey = KEY_MAILABLE_TURN_STATUSES.includes(turn.status);
  const name = recipientName(turn);
  const highlighted = progress.needsAction;
  return (
    <li
      aria-label={`${name}, gói ${turn.containerName}`}
      data-needs-action={highlighted ? "true" : undefined}
      className={cn(
        "rounded-2xl border bg-heritage-surface p-4",
        highlighted
          ? "border-[#E0C486] border-l-4 border-l-[#C9A55C] bg-[#FDF9EE]"
          : "border-heritage-border",
      )}
    >
      <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_11rem]">
        <div className="flex min-w-0 items-center gap-3">
          <Initial name={turn.beneficiaryFullName ?? "?"} className="size-10 text-sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{name}</p>
            <p className="truncate text-sm text-heritage-muted">Gói “{turn.containerName}”</p>
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
              aria-expanded={keyFormOpen}
              onClick={() => setKeyFormOpen(!keyFormOpen)}
            >
              Gửi mã qua email
            </button>
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
      {keyFormOpen && (
        <div className="mt-4">
          <HandoverSendKey
            caseId={caseId}
            turnId={turn.turnId}
            onSent={(sentAt) => {
              setKeySentAt(sentAt);
              setKeyFormOpen(false);
            }}
            onCancel={() => setKeyFormOpen(false)}
          />
        </div>
      )}
      {keySentAt && (
        <p role="status" className="mt-3 text-sm">
          Đã gửi mã cho người nhận lúc {formatDateTime(keySentAt)}.
        </p>
      )}
      {expanded && (
        <div id={detailId} className="mt-4 space-y-4 border-t border-heritage-border pt-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_11rem]">
            <div className="hidden lg:block" aria-hidden="true" />
            <StepTimes columns={progress.detailColumns} />
            <div className="hidden lg:block" aria-hidden="true" />
          </div>
          <DetailBoxes caseId={caseId} turn={turn} progress={progress} />
        </div>
      )}
    </li>
  );
}
