import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Download, Lock, Package, Phone, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "cn";
import { ZodError } from "zod";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { HTTP_STATUS } from "@/shared/constants";
import { deathCaseService } from "../api/deathCaseService";
import {
  KEY_MAILABLE_TURN_STATUSES,
  RESENDABLE_TURN_STATUSES,
  type HandoverProgress,
  type HandoverProgressTurn,
} from "../model/handoverProgress.schema";
import { groupTurnsByRecipient, type RecipientGroup } from "../model/recipientGroups";
import { remainingText } from "../model/remainingText";
import { handoverProgressKey, useHandoverProgress } from "../model/useHandoverProgress";
import {
  buttonStyles,
  Chip,
  formatDateTime,
  Initial,
  Panel,
  type Tone,
} from "@/shared/ui/heritageKit";
import { usePolicyWindows } from "@/shared/settings/usePolicyWindows";

const turnStatusLabels: Record<HandoverProgressTurn["status"], string> = {
  INVITED: "Đã mời, chờ người nhận phản hồi",
  INITIAL_RESPONSE_EXPIRED: "Quá hạn phản hồi, người nhận vẫn có thể nhận muộn",
  IDENTITY_IN_PROGRESS: "Người nhận đang xác minh danh tính",
  READY_TO_ACCEPT: "Chờ người nhận quyết định",
  HANDOVER_COMMITTED: "Người nhận đã đồng ý nhận",
  DECLINED: "Người nhận đã từ chối",
  DECISION_EXPIRED: "Quá hạn quyết định",
  CANCELLED: "Lượt đã bị hủy",
  LAPSED: "Lượt đã kết thúc",
};

/** Nhãn ngắn trong danh sách; câu đầy đủ nằm ở phần chi tiết. */
const turnChips: Record<HandoverProgressTurn["status"], { label: string; tone: Tone }> = {
  INVITED: { label: "Chờ phản hồi", tone: "warning" },
  INITIAL_RESPONSE_EXPIRED: { label: "Quá hạn phản hồi", tone: "neutral" },
  IDENTITY_IN_PROGRESS: { label: "Chờ xác minh", tone: "neutral" },
  READY_TO_ACCEPT: { label: "Chờ quyết định", tone: "warning" },
  HANDOVER_COMMITTED: { label: "Đã đồng ý", tone: "success" },
  DECLINED: { label: "Từ chối nhận", tone: "neutral" },
  DECISION_EXPIRED: { label: "Quá hạn quyết định", tone: "neutral" },
  CANCELLED: { label: "Đã hủy", tone: "neutral" },
  LAPSED: { label: "Đã kết thúc", tone: "neutral" },
};

const summaryLabels: Array<[keyof HandoverProgress["summary"], string]> = [
  ["waitingResponse", "Chờ phản hồi"],
  ["inVerification", "Đang xác minh"],
  ["accepted", "Đã đồng ý"],
  ["declined", "Đã từ chối"],
  ["ended", "Đã kết thúc"],
];

function errorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === HTTP_STATUS.NOT_FOUND) {
    return "Không tìm thấy hồ sơ, hoặc tài khoản không còn là Executor đang hiệu lực của kho này.";
  }
  if (error instanceof ZodError) {
    return "Dữ liệu tiến độ trả về không đúng định dạng. Báo nhóm Backend kiểm tra hợp đồng API.";
  }
  return "Không tải được tiến độ bàn giao.";
}

function Deadline({
  label,
  value,
  serverTime,
}: {
  label: string;
  value: string;
  serverTime: string;
}) {
  return (
    <div>
      <dt className="text-heritage-muted">{label}</dt>
      <dd className="font-medium">
        {formatDateTime(value)} ({remainingText(value, serverTime)})
      </dd>
    </div>
  );
}

/**
 * Văn bản từ chối của người nhận, xem ngay trong trang như ảnh giấy chứng tử Người xét duyệt đọc:
 * có phóng to, thu nhỏ, xoay và tải xuống. Ảnh chỉ là object URL tạm trong RAM, thu hồi khi đóng.
 */
const PAPER_ZOOM_STEPS = [50, 75, 100, 125, 150, 200];

function DeclinePaper({ caseId, turnId }: { caseId: string; turnId: string }) {
  const action = usePrivateAction();
  const [url, setUrl] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState(2);
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);
  const open = () =>
    void action.execute(
      () => deathCaseService.declinePaper(caseId, turnId),
      (blob) => {
        setZoomIndex(2);
        setRotation(0);
        setUrl(URL.createObjectURL(blob));
      },
    );
  if (!url) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          className={buttonStyles.outline}
          onClick={open}
          disabled={action.pending}
        >
          {action.pending ? "Đang tải…" : "Xem văn bản từ chối"}
        </button>
        {action.error && (
          <p role="alert" className="text-sm text-[#A32119]">
            {action.error}
          </p>
        )}
      </div>
    );
  }
  const zoom = PAPER_ZOOM_STEPS[zoomIndex];
  return (
    <section aria-label="Văn bản từ chối" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Điều khiển ảnh">
        <button
          type="button"
          aria-label="Thu nhỏ"
          className={buttonStyles.outline}
          disabled={zoomIndex === 0}
          onClick={() => setZoomIndex(zoomIndex - 1)}
        >
          <ZoomOut className="size-4" aria-hidden="true" />
        </button>
        <span className="w-12 text-center text-sm tabular-nums">{zoom}%</span>
        <button
          type="button"
          aria-label="Phóng to"
          className={buttonStyles.outline}
          disabled={zoomIndex === PAPER_ZOOM_STEPS.length - 1}
          onClick={() => setZoomIndex(zoomIndex + 1)}
        >
          <ZoomIn className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Xoay ảnh"
          className={buttonStyles.outline}
          onClick={() => setRotation((rotation + 90) % 360)}
        >
          <RotateCw className="size-4" aria-hidden="true" />
        </button>
        <a
          href={url}
          download="van-ban-tu-choi.png"
          className={`${buttonStyles.outline} inline-flex`}
        >
          <Download className="size-4" aria-hidden="true" />
          Tải xuống
        </a>
        <button type="button" className={buttonStyles.outline} onClick={() => setUrl(null)}>
          Đóng
        </button>
      </div>
      <div className="h-[28rem] overflow-auto rounded-xl border border-heritage-border bg-[#ECE8DB]">
        <img
          src={url}
          alt="Văn bản từ chối nhận di sản"
          style={{
            width: `${zoom}%`,
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
          className="mx-auto max-w-none"
        />
      </div>
    </section>
  );
}

/**
 * Gửi lại lời mời cho lượt chưa ai nhận. Không optimistic: chỉ báo thành công sau response của BE,
 * rồi đọc lại tiến độ. Link cũ hết dùng nên cần xác nhận trước khi gửi.
 */
function ResendInvitation({
  caseId,
  turnId,
  firstSend,
}: {
  caseId: string;
  turnId: string;
  firstSend: boolean;
}) {
  const { resendCooldownMinutes } = usePolicyWindows();
  const client = useQueryClient();
  const action = usePrivateAction();
  const [confirming, setConfirming] = useState(false);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const send = () =>
    void action.execute(
      () => deathCaseService.resendInvitation(caseId, turnId),
      (result) => {
        setConfirming(false);
        setSentAt(result.invitationSentAt);
        void client.invalidateQueries({ queryKey: handoverProgressKey(caseId) });
      },
    );
  return (
    <div className="space-y-2">
      {!confirming ? (
        <button type="button" className={buttonStyles.outline} onClick={() => setConfirming(true)}>
          {firstSend ? "Gửi thư mời" : "Gửi lại lời mời"}
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-heritage-border bg-white/60 p-4 text-sm">
          {firstSend ? (
            <p>
              Hệ thống không tự gửi thư. Bấm xác nhận để gửi thư mời nhận tài sản tới người nhận;
              hạn phản hồi tính từ lúc thư được gửi.
            </p>
          ) : (
            <p>
              Lời mời cũ sẽ không dùng được nữa. Hạn phản hồi không đặt lại. Chỉ gửi lại được sau
              tối thiểu {resendCooldownMinutes} phút kể từ lần gửi trước.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonStyles.dark}
              onClick={send}
              disabled={action.pending}
            >
              {action.pending ? "Đang gửi…" : firstSend ? "Xác nhận gửi" : "Xác nhận gửi lại"}
            </button>
            <button
              type="button"
              className={buttonStyles.outline}
              onClick={() => setConfirming(false)}
              disabled={action.pending}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
      {sentAt && !action.error && (
        <p role="status" className="text-sm">
          Đã gửi lại lời mời lúc {formatDateTime(sentAt)}.
        </p>
      )}
    </div>
  );
}

/**
 * Gửi khóa mở gói cho người nhận qua email. Executor nhập lại khóa mình đang giữ (Backend kiểm rồi gửi, không lưu khóa);
 * ô nhập được xóa sau khi gửi xong. Không optimistic: chỉ báo thành công sau response của BE.
 */
function SendKey({ caseId, turnId }: { caseId: string; turnId: string }) {
  const action = usePrivateAction();
  const [opened, setOpened] = useState(false);
  const [key, setKey] = useState("");
  const [sentAt, setSentAt] = useState<string | null>(null);
  const send = () =>
    void action.execute(
      () => deathCaseService.sendKey(caseId, turnId, key.trim()),
      (result) => {
        setKey("");
        setOpened(false);
        setSentAt(result.sentAt);
      },
    );
  return (
    <div className="space-y-2">
      {!opened ? (
        <button type="button" className={buttonStyles.outline} onClick={() => setOpened(true)}>
          Gửi khóa cho người nhận
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-heritage-border bg-white/60 p-4 text-sm">
          <label className="block space-y-1">
            <span className="font-medium">Khóa mở gói bạn đang giữ</span>
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
            Khóa được gửi riêng tới email của người nhận, tách khỏi thư mời. Hệ thống không lưu
            khóa.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonStyles.dark}
              onClick={send}
              disabled={action.pending || key.trim().length === 0}
            >
              {action.pending ? "Đang gửi…" : "Gửi khóa"}
            </button>
            <button
              type="button"
              className={buttonStyles.outline}
              onClick={() => setOpened(false)}
              disabled={action.pending}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
      {sentAt && !action.error && (
        <p role="status" className="text-sm">
          Đã gửi khóa cho người nhận lúc {formatDateTime(sentAt)}.
        </p>
      )}
    </div>
  );
}

const isFinished = (turn: HandoverProgressTurn) =>
  turn.status === "HANDOVER_COMMITTED" &&
  turn.totalItems > 0 &&
  turn.downloadedItems >= turn.totalItems;
const isDownloading = (turn: HandoverProgressTurn) =>
  turn.status === "HANDOVER_COMMITTED" && turn.downloadedItems < turn.totalItems;

/** Chi tiết một lượt: hạn, quyền tải, tài sản đã tải (chỉ tên và trạng thái, không có nội dung). */
function TurnDetail({
  caseId,
  turn,
  serverTime,
}: {
  caseId: string;
  turn: HandoverProgressTurn;
  serverTime: string;
}) {
  const waiting = turn.status === "INVITED" || turn.status === "INITIAL_RESPONSE_EXPIRED";
  const deciding = turn.status === "IDENTITY_IN_PROGRESS" || turn.status === "READY_TO_ACCEPT";
  return (
    <Panel title={`${turn.containerName} — tài sản đã tải`}>
      <p className="text-sm font-medium">{turnStatusLabels[turn.status]}</p>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-heritage-muted">Đã mời lúc</dt>
          <dd className="font-medium">{formatDateTime(turn.invitedAt)}</dd>
        </div>
        {waiting && (
          <Deadline label="Hạn phản hồi" value={turn.responseDeadline} serverTime={serverTime} />
        )}
        {deciding && turn.decisionDeadline && (
          <Deadline label="Hạn quyết định" value={turn.decisionDeadline} serverTime={serverTime} />
        )}
        {turn.decidedAt && (
          <div>
            <dt className="text-heritage-muted">Quyết định lúc</dt>
            <dd className="font-medium">{formatDateTime(turn.decidedAt)}</dd>
          </div>
        )}
        {turn.receivedAllAt && (
          <div>
            <dt className="text-heritage-muted">Người nhận xác nhận đã nhận đủ</dt>
            <dd className="font-medium">{formatDateTime(turn.receivedAllAt)}</dd>
          </div>
        )}
        {turn.beneficiaryFullName && (
          <>
            <div>
              <dt className="text-heritage-muted">Người nhận</dt>
              <dd className="font-medium">{turn.beneficiaryFullName}</dd>
            </div>
            <div>
              <dt className="text-heritage-muted">Số điện thoại liên hệ</dt>
              <dd className="font-medium">{turn.beneficiaryPhone ?? "Chưa có"}</dd>
            </div>
          </>
        )}
      </dl>
      {RESENDABLE_TURN_STATUSES.includes(turn.status) && (
        <div className="mt-4">
          <ResendInvitation
            caseId={caseId}
            turnId={turn.turnId}
            firstSend={turn.invitationSentAt === null}
          />
        </div>
      )}
      {turn.status === "DECLINED" && (
        <div className="mt-4">
          <DeclinePaper caseId={caseId} turnId={turn.turnId} />
        </div>
      )}
      {KEY_MAILABLE_TURN_STATUSES.includes(turn.status) && (
        <div className="mt-4">
          <SendKey caseId={caseId} turnId={turn.turnId} />
        </div>
      )}
      {turn.identityConfirmedByExecutor && (
        <p className="mt-4 text-sm text-heritage-muted">
          Danh tính người nhận đã được Executor xác nhận bằng tay.
        </p>
      )}
      <p className="mt-5 text-sm font-semibold">
        Đã tải {turn.downloadedItems}/{turn.totalItems} tài sản
      </p>
      {turn.items.length > 0 && (
        <ul className="mt-2 divide-y divide-heritage-border">
          {turn.items.map((item) => (
            <li key={item.itemId} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold">
                  {item.name} ({item.kind === "FILE" ? "tệp" : "văn bản"})
                </p>
                <p className="text-xs text-heritage-muted">
                  {item.downloaded && item.firstDownloadedAt
                    ? `Tải lần đầu ${formatDateTime(item.firstDownloadedAt)}`
                    : "Chưa tải"}
                </p>
              </div>
              <Chip tone={item.downloaded ? "success" : "neutral"}>
                {item.downloaded ? "Đã tải" : "Chưa tải"}
              </Chip>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 flex items-start gap-2 text-xs text-heritage-muted">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Chỉ hiển thị tên tài sản và trạng thái tải, không có nội dung.
      </p>
    </Panel>
  );
}

/** Số thẻ người nhận thấy được trước khi khung danh sách phải cuộn. */
const VISIBLE_RECIPIENTS = 3;

/** Thanh tiến độ tải của một gói; đủ thì chuyển màu xanh. */
function DownloadBar({ downloaded, total }: { downloaded: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 0;
  const done = total > 0 && downloaded >= total;
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-label="Tiến độ tải"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={downloaded}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ECE8DB]"
      >
        <div
          className={cn("h-full rounded-full", done ? "bg-[#1F7A55]" : "bg-[#C9A55C]")}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-xs text-heritage-muted tabular-nums">
        {downloaded}/{total} tài sản đã tải
      </span>
    </div>
  );
}

/**
 * Một người nhận và các gói của họ. Mỗi gói là một lượt riêng (trạng thái, hạn, tiến độ tải riêng),
 * nên mỗi gói có nút xem chi tiết riêng.
 */
function RecipientCard({
  group,
  selectedTurnId,
  onChoose,
}: {
  group: RecipientGroup;
  selectedTurnId: string;
  onChoose: (turnId: string) => void;
}) {
  const displayName = group.fullName ?? "Người nhận";
  return (
    <li className="rounded-2xl border border-heritage-border bg-white/50 p-4">
      <div className="flex items-center gap-3">
        <Initial name={group.fullName ?? "?"} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{displayName}</p>
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-heritage-muted">
            <span>CCCD ***{group.citizenIdLast4}</span>
            {group.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" aria-hidden="true" />
                {group.phone}
              </span>
            )}
          </p>
        </div>
        <Chip tone="neutral">{group.turns.length} gói</Chip>
      </div>
      <ul className="mt-4 space-y-2" aria-label={`Các gói của ${displayName}`}>
        {group.turns.map((turn) => {
          const chip = turnChips[turn.status];
          const isSelected = selectedTurnId === turn.turnId;
          return (
            <li
              key={turn.turnId}
              className={cn(
                "space-y-2 rounded-xl border p-3 transition-colors",
                isSelected
                  ? "border-[#C9A55C] bg-[#FBF6EA]"
                  : "border-heritage-border bg-heritage-surface",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex min-w-0 items-center gap-2 font-medium">
                  <Package className="size-4 shrink-0 text-heritage-muted" aria-hidden="true" />
                  <span className="truncate">Gói “{turn.containerName}”</span>
                </p>
                <div className="flex items-center gap-2">
                  <Chip tone={chip.tone}>{chip.label}</Chip>
                  <button
                    type="button"
                    className={cn(buttonStyles.outline, "min-h-9 px-4")}
                    aria-pressed={isSelected}
                    onClick={() => onChoose(turn.turnId)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
              <DownloadBar downloaded={turn.downloadedItems} total={turn.totalItems} />
            </li>
          );
        })}
      </ul>
    </li>
  );
}

function Tile({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="rounded-2xl border border-heritage-border bg-heritage-surface p-5">
      <dt className="text-xs text-heritage-muted">{label}</dt>
      <dd className="mt-2 text-3xl font-semibold tabular-nums text-heritage-primary">{value}</dd>
      <p className="mt-2 text-xs text-heritage-muted">{caption}</p>
    </div>
  );
}

/**
 * Tiến độ bàn giao chỉ đọc cho Executor: từng lượt (một gói cho một người nhận), hạn và
 * tài sản đã tải. Không có thao tác ghi; mọi quyền do Backend kiểm.
 */
export function HandoverProgressPanel({
  caseId,
  chosenTurn: controlledTurn,
  onChooseTurn,
}: {
  caseId: string;
  /** Lượt đang xem do trang cha giữ, để thanh "Bước hiện tại" theo đúng người nhận đang xem. */
  chosenTurn?: string | null;
  onChooseTurn?: (turnId: string) => void;
}) {
  const query = useHandoverProgress(caseId);
  const [ownTurn, setOwnTurn] = useState<string | null>(null);
  let chosenTurn = ownTurn;
  let setChosenTurn: (turnId: string) => void = setOwnTurn;
  if (onChooseTurn) {
    chosenTurn = controlledTurn ?? null;
    setChosenTurn = onChooseTurn;
  }
  return (
    <section aria-labelledby="handover-progress-title" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="handover-progress-title" className="text-2xl font-semibold text-heritage-primary">
          Tiến độ bàn giao
        </h2>
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Tải lại tiến độ
        </button>
      </div>
      {query.isPending ? (
        <p role="status">Đang tải tiến độ bàn giao…</p>
      ) : query.isError ? (
        <div role="alert" className="space-y-3">
          <p>{errorMessage(query.error)}</p>
          <button type="button" className={buttonStyles.dark} onClick={() => void query.refetch()}>
            Thử lại
          </button>
        </div>
      ) : !query.data.handoverStarted ? (
        <p role="status">
          Bàn giao chưa bắt đầu. Bàn giao chỉ mở sau khi Verifier duyệt hồ sơ chứng tử.
        </p>
      ) : query.data.turns.length === 0 ? (
        <p role="status">Hồ sơ đã duyệt nhưng chưa có lượt bàn giao nào.</p>
      ) : (
        <ProgressBody
          caseId={caseId}
          data={query.data}
          chosenTurn={chosenTurn}
          onChoose={setChosenTurn}
        />
      )}
    </section>
  );
}

function ProgressBody({
  caseId,
  data,
  chosenTurn,
  onChoose,
}: {
  caseId: string;
  data: HandoverProgress;
  chosenTurn: string | null;
  onChoose: (turnId: string) => void;
}) {
  const selected = data.turns.find((turn) => turn.turnId === chosenTurn) ?? data.turns[0];
  const groups = groupTurnsByRecipient(data.turns);
  const finished = data.turns.filter(isFinished).length;
  const downloading = data.turns.filter(isDownloading).length;
  const activeGrants = data.turns
    .filter((turn) => turn.grantStatus === "ACTIVE" && turn.grantExpiresAt)
    .map((turn) => turn.grantExpiresAt!)
    .sort();
  return (
    <>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="Người nhận"
          value={String(groups.length)}
          caption={`Tổng ${data.summary.totalTurns} gói bàn giao`}
        />
        <Tile label="Đã tải xong" value={String(finished)} caption="gói" />
        <Tile label="Đang tải" value={String(downloading)} caption="gói" />
        <Tile
          label="Hạn tải còn"
          value={
            activeGrants[0]
              ? remainingText(activeGrants[0], data.serverTime).replace("còn ", "")
              : "—"
          }
          caption="tính đến lượt sớm nhất"
        />
      </dl>
      <ul className="flex flex-wrap gap-2" aria-label="Tóm tắt các lượt">
        {summaryLabels.map(([key, label]) => (
          <li key={key}>
            <Chip tone="neutral">
              {label}: {data.summary[key]}
            </Chip>
          </li>
        ))}
      </ul>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Theo người nhận">
          {groups.length > VISIBLE_RECIPIENTS && (
            <p className="-mt-2 mb-3 text-sm text-heritage-muted">
              {groups.length} người nhận, cuộn trong khung để xem thêm.
            </p>
          )}
          {/* Nhiều người nhận thì cuộn trong khung (khoảng 3 thẻ), để phần chi tiết bên cạnh không bị đẩy xa. */}
          <ul
            aria-label="Danh sách người nhận"
            tabIndex={groups.length > VISIBLE_RECIPIENTS ? 0 : undefined}
            className="max-h-[40rem] space-y-4 overflow-y-auto overscroll-contain pr-1"
          >
            {groups.map((group) => (
              <RecipientCard
                key={group.key}
                group={group}
                selectedTurnId={selected.turnId}
                onChoose={onChoose}
              />
            ))}
          </ul>
        </Panel>
        <TurnDetail
          key={selected.turnId}
          caseId={caseId}
          turn={selected}
          serverTime={data.serverTime}
        />
      </div>
    </>
  );
}
