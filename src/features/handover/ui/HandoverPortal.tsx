import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Download, Lock, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import type { z } from "zod";
import { ROUTES } from "@/shared/config/routes.config";
import { formatDate, formatDateTime } from "@/shared/lib/dateFormat";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { buttonStyles, Chip, Notice, Panel, type Tone } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";
import type { handoverTurnSchema } from "../model/handover.schema";
import { useGrantDownload } from "../model/useGrantDownload";
import { useHandoverAction } from "../model/useHandoverAction";
import { remainingText } from "../model/handover.format";
import { currentHandoverStep } from "../model/handoverStep";
import { HandoverStepper } from "./HandoverStepper";
import { HandoverTerms } from "./HandoverTerms";
import { RecipientGuide } from "./RecipientGuide";
import { RecipientSubmissionPanel } from "./RecipientSubmissionPanel";

type Turn = z.infer<typeof handoverTurnSchema>;

const labels: Record<string, string> = {
  INVITED: "Được mời",
  INITIAL_RESPONSE_EXPIRED: "Đã qua hạn phản hồi ban đầu",
  IDENTITY_IN_PROGRESS: "Đang xác minh danh tính",
  READY_TO_ACCEPT: "Chờ quyết định tiếp nhận",
  HANDOVER_COMMITTED: "Đã tiếp nhận",
  DECLINED: "Đã từ chối",
  DECISION_EXPIRED: "Đã hết hạn quyết định",
  CANCELLED: "Đã hủy",
  LAPSED: "Đã kết thúc",
};
const tones: Record<string, Tone> = {
  INVITED: "warning",
  INITIAL_RESPONSE_EXPIRED: "neutral",
  IDENTITY_IN_PROGRESS: "warning",
  READY_TO_ACCEPT: "warning",
  HANDOVER_COMMITTED: "success",
  DECLINED: "neutral",
  DECISION_EXPIRED: "neutral",
  CANCELLED: "neutral",
  LAPSED: "neutral",
};
const statusHints: Record<string, string> = {
  INITIAL_RESPONSE_EXPIRED:
    "Đã qua hạn phản hồi ban đầu nhưng bạn vẫn có thể nhận lời mời; hệ thống sẽ kiểm tra khi bạn xác nhận.",
  DECISION_EXPIRED: "Hạn quyết định đã kết thúc nên lượt này không còn nhận được nữa.",
  DECLINED: "Bạn đã từ chối lượt bàn giao này.",
  CANCELLED:
    "Lượt bàn giao này đã bị hủy vì chủ kho đã được xác nhận còn sống. Nội dung không còn được bàn giao.",
  LAPSED: "Lượt bàn giao này đã kết thúc.",
};
const grantLabels: Record<string, string> = {
  ACTIVE: "Đang hiệu lực",
  EXPIRED: "Đã hết hạn, không còn tải được",
  BLOCKED: "Đang tạm dừng trong lúc hồ sơ được xác minh lại, chưa thể tải",
  REVOKED: "Đã bị thu hồi, không còn tải được",
};
const kindLabels: Record<string, string> = { FILE: "Tệp", TEXT: "Văn bản" };

const DIALOG_CLASS = "max-w-lg bg-[#FBFAF5] p-7";
const RED_BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#A32119] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#8A1B14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold disabled:pointer-events-none disabled:opacity-50";

/** Hộp thoại xác nhận từ chối (thiết kế 102). Backend chưa nhận lý do từ chối nên không có ô lý do. */
function DeclineDialog({
  groupName,
  pending,
  onKeep,
  onDecline,
}: {
  groupName: string;
  pending: boolean;
  onKeep: () => void;
  onDecline: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onKeep()}>
      <DialogContent className={DIALOG_CLASS} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-heritage-primary">
            Từ chối nhận?
          </DialogTitle>
          <DialogDescription className="text-heritage-muted">
            Phần “{groupName}” sẽ không được bàn giao cho bạn.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={pending}
            onClick={onKeep}
          >
            Giữ lại
          </button>
          <button type="button" className={RED_BUTTON} disabled={pending} onClick={onDecline}>
            {pending ? "Đang gửi…" : "Từ chối nhận"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Một dòng của danh sách khóa-giá trị: khóa bên trái, giá trị bên phải, ngăn bằng đường kẻ mảnh. */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(120px,32%)_minmax(0,1fr)] gap-4 border-b border-heritage-border py-3">
      <dt className="text-sm text-heritage-muted">{label}</dt>
      <dd className="text-sm font-semibold">{value}</dd>
    </div>
  );
}

/** Dòng Cần trợ giúp kèm liên kết tới trang Liên hệ công khai, đặt dưới các thông báo kết thúc. */
function SupportLine() {
  return (
    <p className="text-sm text-heritage-muted">
      Cần trợ giúp?{" "}
      <Link className="font-semibold text-heritage-primary underline" to={ROUTES.PUBLIC.CONTACT}>
        Liên hệ hỗ trợ
      </Link>
    </p>
  );
}

/** Hạn phản hồi chỉ còn tác dụng ở giai đoạn phản hồi lời mời và xác minh. */
const RESPONSE_PHASE = ["INVITED", "INITIAL_RESPONSE_EXPIRED", "IDENTITY_IN_PROGRESS"];
/** Hạn quyết định chỉ còn tác dụng khi chờ quyết định hoặc khi đã quá hạn quyết định. */
const DECISION_PHASE = ["READY_TO_ACCEPT", "DECISION_EXPIRED"];
/** Các trạng thái kết thúc mà người nhận có thể cần hỏi thêm. */
const NEEDS_HELP_STATUS = ["DECISION_EXPIRED", "CANCELLED", "LAPSED"];
/** Các trạng thái quyền tải mà người nhận có thể cần hỏi thêm. */
const NEEDS_HELP_GRANT = ["BLOCKED", "EXPIRED", "REVOKED"];
/** Ngày kết thúc chỉ có nghĩa khi quyền tải còn hiệu lực hoặc đang tạm dừng. */
const GRANT_WITH_DATE = ["ACTIVE", "BLOCKED"];
/** Chữ thông báo thành công ngay sau khi người nhận quyết định. */
const doneLabels = { accept: "Đã tiếp nhận", decline: "Đã từ chối" };

/**
 * Một lượt bàn giao: thông báo hạn tải và xác nhận ở đầu thẻ, tiến trình sáu bước, chi tiết lượt, nội dung được tải,
 * rồi khung phản hồi. Khi người nhận có nhiều lượt chưa mở tên gói, thẻ ghi thêm ngày mời để phân biệt.
 */
function TurnCard({ turn, showInvitedDate }: { turn: Turn; showInvitedDate: boolean }) {
  const action = useHandoverAction();
  const content = useGrantDownload();
  const client = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [justDecided, setJustDecided] = useState<"accept" | "decline" | null>(null);
  const [typedKey, setTypedKey] = useState("");
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["handover"] });
  };
  const approvedChoice = useQuery({
    queryKey: ["handover", "submission", turn.id],
    queryFn: ({ signal }) => handoverService.latestSubmission(turn.id, signal),
    enabled: turn.status === "READY_TO_ACCEPT",
    retry: false,
  });
  // Người nhận đã chọn Chấp nhận hoặc Từ chối trong hồ sơ được duyệt thì chỉ hiện đúng nút đó (không có hồ sơ thì hiện cả hai).
  const chosenKind = approvedChoice.data?.status === "APPROVED" ? approvedChoice.data.kind : null;
  const step = currentHandoverStep(turn.status);
  const hasGroupName = turn.container !== null;
  let groupName = "Lượt bàn giao";
  if (turn.container) {
    groupName = turn.container.name;
  }
  let heading = groupName;
  if (!hasGroupName && showInvitedDate) {
    heading = `${groupName} · mời ngày ${formatDate(turn.invitedAt)}`;
  }
  const grantActive = turn.grant?.status === "ACTIVE";
  let doneShown: "accept" | "decline" | null = null;
  if (justDecided === "accept" && turn.status === "HANDOVER_COMMITTED") {
    doneShown = "accept";
  }
  if (justDecided === "decline" && turn.status === "DECLINED") {
    doneShown = "decline";
  }
  let needsHelp = NEEDS_HELP_STATUS.includes(turn.status);
  if (turn.grant && NEEDS_HELP_GRANT.includes(turn.grant.status)) {
    needsHelp = true;
  }
  let grantLine = "";
  if (turn.grant) {
    grantLine = `Thời hạn tải nội dung: ${grantLabels[turn.grant.status] ?? turn.grant.status}`;
    if (GRANT_WITH_DATE.includes(turn.grant.status)) {
      grantLine = `${grantLine} · đến ${formatDateTime(turn.grant.expiresAt)}`;
    }
  }
  return (
    <article className="space-y-6">
      {doneShown && (
        <Notice tone="success" role="status" title="Thành công">
          {doneLabels[doneShown]}
        </Notice>
      )}
      {grantActive && turn.grant && (
        <Notice
          tone="warning"
          title={`${remainingText(turn.grant.expiresAt, turn.serverTime)} để tải nội dung`}
        >
          Hết hạn lúc {formatDateTime(turn.grant.expiresAt)}. Sau đó nội dung không còn tải được.
        </Notice>
      )}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-heritage-primary">{heading}</h2>
        <Chip tone={tones[turn.status] ?? "neutral"}>{labels[turn.status]}</Chip>
      </header>
      {step !== null && (
        <Panel title="Tiến trình bàn giao">
          <HandoverStepper current={step} />
        </Panel>
      )}
      {turn.status === "IDENTITY_IN_PROGRESS" && (
        <Panel title="Hồ sơ người nhận">
          <RecipientSubmissionPanel turnId={turn.id} groupName={groupName} onChanged={refresh} />
        </Panel>
      )}
      <Panel title="Chi tiết lượt nhận">
        <div className="space-y-4">
          <dl className="border-t border-heritage-border">
            {hasGroupName && <SummaryRow label="Phần để lại" value={`Nhóm “${groupName}”`} />}
            {RESPONSE_PHASE.includes(turn.status) && (
              <SummaryRow label="Hạn phản hồi" value={formatDateTime(turn.responseDeadline)} />
            )}
            {DECISION_PHASE.includes(turn.status) && turn.decisionDeadline && (
              <SummaryRow label="Hạn quyết định" value={formatDateTime(turn.decisionDeadline)} />
            )}
          </dl>
          {statusHints[turn.status] && <p className="text-sm">{statusHints[turn.status]}</p>}
          {turn.status === "READY_TO_ACCEPT" && turn.decisionDeadline && (
            <p className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm font-medium text-[#7A5B24]">
              {remainingText(turn.decisionDeadline, turn.serverTime)} để quyết định
            </p>
          )}
          {turn.status === "INVITED" && (
            <p className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm font-medium text-[#7A5B24]">
              {remainingText(turn.responseDeadline, turn.serverTime)} để phản hồi lời mời
            </p>
          )}
          {turn.identityBypassed && (
            <p role="status" className="text-sm text-amber-800">
              Môi trường Development đang bỏ qua bước xác minh danh tính. Đây không phải bằng chứng
              danh tính đã được xác minh.
            </p>
          )}
          {turn.identityConfirmedByExecutor && (
            <p role="status" className="text-sm text-heritage-muted">
              Danh tính của bạn đã được Người thực hiện của kho xác nhận.
            </p>
          )}
          {turn.status === "IDENTITY_IN_PROGRESS" && (
            <p className="text-sm leading-6 text-heritage-muted">
              Chọn Chấp nhận hoặc Từ chối và nộp hồ sơ ở khung “Hồ sơ người nhận” phía trên. Người
              xét duyệt đối chiếu ảnh căn cước rồi mới mở bước quyết định cho bạn. Nếu không nộp
              được, hãy liên hệ Người thực hiện của kho để được xác nhận trực tiếp.
            </p>
          )}
          {turn.reviewer && (
            <p className="text-sm" data-testid="reviewer-line">
              Người xét duyệt hồ sơ: {turn.reviewer.fullName}
              {turn.reviewer.lawyerCardNumber
                ? ` (thẻ luật sư ${turn.reviewer.lawyerCardNumber})`
                : ""}
            </p>
          )}
          {grantLine && <p className="text-sm">{grantLine}</p>}
          {needsHelp && <SupportLine />}
        </div>
      </Panel>
      {turn.status === "HANDOVER_COMMITTED" && turn.grant && (
        <Panel title="Xác nhận đã nhận đủ">
          {turn.receivedAllAt ? (
            <p role="status" className="text-sm">
              Bạn đã xác nhận nhận đủ lúc {formatDateTime(turn.receivedAllAt)}.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-heritage-muted">
                Tải xong các mục bên dưới thì bấm xác nhận để Người thực thi biết lượt này đã hoàn
                tất.
              </p>
              <button
                type="button"
                className={buttonStyles.dark}
                disabled={action.pending}
                onClick={() =>
                  void action.execute(() => handoverService.confirmReceivedAll(turn.id), refresh)
                }
              >
                Tôi đã nhận đủ
              </button>
            </div>
          )}
        </Panel>
      )}
      {turn.items.length > 0 && (
        <Panel title="Các mục dành cho bạn">
          <ul className="divide-y divide-heritage-border">
            {turn.items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block break-words text-sm font-semibold">{item.name}</span>
                  <span className="block text-xs text-heritage-muted">
                    {kindLabels[item.kind] ?? "Mục"} · {formatStorageSize(item.sizeBytes)}
                  </span>
                </span>
                {turn.grant?.status === "ACTIVE" && (
                  <button
                    type="button"
                    className={buttonStyles.outline}
                    aria-label={`Tải xuống ${item.name}`}
                    disabled={content.pending || action.pending}
                    onClick={() =>
                      void content.download(
                        () => handoverService.download(turn.grant!.id, item.id),
                        (item.fileName ?? `${item.name}.txt`).replace(/[^\p{L}\p{N} ._()-]/gu, "_"),
                      )
                    }
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Tải xuống
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {turn.status === "READY_TO_ACCEPT" && (
        <Panel title="Phản hồi">
          <div className="space-y-4">
            <HandoverTerms groupName={groupName} />
            {turn.keyRequired && !turn.keyVerified && (
              <div className="space-y-2 rounded-xl border border-heritage-border bg-white p-3">
                <label className="block text-sm font-medium" htmlFor={`key-${turn.id}`}>
                  Khóa mở gói do Người thực hiện đưa
                </label>
                <input
                  id={`key-${turn.id}`}
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={typedKey}
                  disabled={action.pending}
                  onChange={(event) => setTypedKey(event.target.value)}
                  className="h-11 w-full rounded-xl border border-heritage-border px-3 font-mono text-sm uppercase"
                />
                <button
                  type="button"
                  className={`${buttonStyles.dark} w-full`}
                  disabled={action.pending || !typedKey.trim()}
                  onClick={() =>
                    void action.execute(
                      () => handoverService.verifyKey(turn.id, typedKey),
                      () => {
                        setTypedKey("");
                        refresh();
                      },
                    )
                  }
                >
                  Xác nhận khóa
                </button>
                <p className="text-xs text-heritage-muted">
                  Liên hệ trực tiếp Người thực hiện của kho để lấy khóa. Nhập sai nhiều lần sẽ bị
                  khóa.
                </p>
              </div>
            )}
            {turn.keyRequired && turn.keyVerified && (
              <p role="status" className="text-sm text-[#1F7A55]">
                Khóa mở gói đã được xác nhận.
              </p>
            )}
            {chosenKind && (
              <p role="status" className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm text-[#7A5B24]">
                Hồ sơ của bạn đã được duyệt với lựa chọn{" "}
                <b>{chosenKind === "ACCEPT" ? "Chấp nhận" : "Từ chối"}</b>. Bấm nút bên dưới để hoàn
                tất.
              </p>
            )}
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={action.pending}
                className="size-5"
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              Tôi đã đọc nội dung và xác nhận quyết định cho lượt này.
            </label>
            {chosenKind !== "DECLINE" && (
              <button
                type="button"
                className={`${buttonStyles.gold} w-full justify-between`}
                disabled={!confirmed || action.pending || (turn.keyRequired && !turn.keyVerified)}
                onClick={() =>
                  void action.execute(
                    () => handoverService.decide(turn.id, "accept"),
                    () => {
                      setJustDecided("accept");
                      refresh();
                    },
                  )
                }
              >
                Đồng ý nhận
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            )}
            {chosenKind !== "ACCEPT" && (
              <button
                type="button"
                className={`${buttonStyles.outline} w-full justify-start`}
                disabled={action.pending}
                onClick={() => setDeclining(true)}
              >
                Từ chối
              </button>
            )}
            <p className="flex items-start gap-2 text-xs text-heritage-muted">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-[#1F7A55]" aria-hidden="true" />
              Từ chối thì phần này sẽ không được bàn giao cho bạn.
            </p>
          </div>
        </Panel>
      )}
      {(action.pending || content.pending) && <p role="status">Đang xử lý yêu cầu…</p>}
      {(action.error || content.error) && (
        <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
          {action.error || content.error}
        </p>
      )}
      {declining && (
        <DeclineDialog
          groupName={groupName}
          pending={action.pending}
          onKeep={() => setDeclining(false)}
          onDecline={() =>
            void action.execute(
              () => handoverService.decide(turn.id, "decline"),
              () => {
                setDeclining(false);
                setJustDecided("decline");
                refresh();
              },
            )
          }
        />
      )}
    </article>
  );
}

/** Danh sách lượt của principal; không dựng grant hoặc trạng thái từ URL. */
export function HandoverPortal() {
  const query = useQuery({
    queryKey: ["handover", "turns"],
    queryFn: ({ signal }) => handoverService.list(signal),
    retry: false,
  });
  if (query.isPending) return <p role="status">Đang tải các lượt bàn giao…</p>;
  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw
            className={`size-4 ${query.isFetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Tải lại lượt bàn giao
        </button>
      </div>
      {query.isError ? (
        <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
          Không tải được các lượt của bạn. Vui lòng thử lại.
        </p>
      ) : query.data.length === 0 ? (
        <div className="space-y-2">
          <p role="status">Bạn chưa nhận lời mời bàn giao nào trên tài khoản này.</p>
          <p className="text-sm text-heritage-muted">
            Mở lại liên kết trong thư mời để nhận lời mời.
          </p>
          <SupportLine />
        </div>
      ) : (
        <>
          <RecipientGuide />
          {query.data.map((turn) => (
            <TurnCard key={turn.id} turn={turn} showInvitedDate={query.data.length > 1} />
          ))}
        </>
      )}
    </div>
  );
}
