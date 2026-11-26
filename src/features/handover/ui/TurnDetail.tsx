import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Clock,
  Download,
  FileText,
  IdCard,
  KeyRound,
  Lock,
  Mail,
  PenLine,
} from "lucide-react";
import type { z } from "zod";
import {
  RecipientPaperButtons,
  RecipientRecordPanel,
  useRecipientRecord,
} from "@/entities/handoverRecord";
import { ROUTES } from "@/shared/config/routes.config";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { ActionButton } from "@/shared/ui/ActionButton";
import { Hero } from "@/shared/ui/Hero";
import { buttonStyles, Chip, Initial, Notice, Panel } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";
import type { handoverTurnSchema } from "../model/handover.schema";
import { remainingText } from "../model/handover.format";
import { describeTurn, itemsLeft, TURN_ENDED_HINTS } from "../model/turnPresentation";
import { useGrantDownload } from "../model/useGrantDownload";
import { useHandoverAction } from "../model/useHandoverAction";
import { useLatestSubmission } from "../model/useLatestSubmission";
import { HandoverStepper } from "./HandoverStepper";
import { ReceiptSection } from "./ReceiptSection";
import { RecipientIdentityPanel } from "./RecipientIdentityPanel";

type Turn = z.infer<typeof handoverTurnSchema>;

const grantLabels: Record<string, string> = {
  ACTIVE: "Đang hiệu lực",
  EXPIRED: "Đã hết hạn, không còn tải được",
  BLOCKED: "Đang tạm dừng trong lúc hồ sơ được xác minh lại, chưa thể tải",
  REVOKED: "Đã bị thu hồi, không còn tải được",
};
const kindLabels: Record<string, string> = { FILE: "Tệp", TEXT: "Văn bản" };

/** Hạn phản hồi chỉ còn tác dụng ở giai đoạn phản hồi lời mời và xác minh. */
const RESPONSE_PHASE = ["INVITED", "INITIAL_RESPONSE_EXPIRED", "IDENTITY_IN_PROGRESS"];
/** Ngày kết thúc chỉ có nghĩa khi quyền tải còn hiệu lực hoặc đang tạm dừng. */
const GRANT_WITH_DATE = ["ACTIVE", "BLOCKED"];

/** Một dòng của danh sách khóa-giá trị. */
function Row({ label, children }: { label: string; children: string }) {
  return (
    <>
      <dt className="text-heritage-muted">{label}</dt>
      <dd className="min-w-0 break-words font-semibold">{children}</dd>
    </>
  );
}

/** Đầu trang chi tiết: quay lại, nhãn trạng thái, tên phần tài sản và bước hiện tại. */
function TurnBar({
  name,
  chip,
  tone,
  sub,
}: {
  name: string;
  chip: string;
  tone: "success" | "warning" | "neutral" | "danger";
  sub: string;
}) {
  return (
    <header className="space-y-3 border-b border-heritage-border pb-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={ROUTES.BENEFICIARY.CLAIM}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-heritage-muted hover:text-heritage-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Quay lại Việc cần làm
        </Link>
        <Chip tone={tone}>{chip}</Chip>
      </div>
      <div className="flex min-w-0 items-center gap-3.5">
        <Initial name={name} className="size-12 shrink-0 text-base" />
        <div className="min-w-0">
          <h1 className="break-words text-xl font-semibold text-heritage-primary">{name}</h1>
          <p className="mt-0.5 text-sm text-heritage-muted">{sub}</p>
        </div>
      </div>
    </header>
  );
}

/**
 * Chi tiết một lượt bàn giao cho người nhận: thanh sáu bước, rồi bên trái là việc cần làm ngay của bước hiện tại, bên
 * phải là danh mục tài sản và thông tin hồ sơ. Mỗi bước chỉ có một thẻ hành động nên người nhận biết bấm gì tiếp theo.
 */
export function TurnDetail({ turnId }: { turnId: string }) {
  const query = useQuery({
    queryKey: ["handover", "turn", turnId],
    queryFn: ({ signal }) => handoverService.get(turnId, signal),
    retry: false,
  });
  if (query.isPending) return <p role="status">Đang tải lượt bàn giao…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="rounded-xl bg-heritage-danger-bg px-4 py-3 text-sm text-heritage-danger">
          Không tải được lượt bàn giao này hoặc lượt này không thuộc tài khoản của bạn.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonStyles.outline}
            onClick={() => void query.refetch()}
          >
            Thử lại
          </button>
          <Link to={ROUTES.BENEFICIARY.CLAIM} className={buttonStyles.dark}>
            Về Việc cần làm
          </Link>
        </div>
      </div>
    );
  }
  return <TurnBody turn={query.data} />;
}

function TurnBody({ turn }: { turn: Turn }) {
  const action = useHandoverAction();
  const content = useGrantDownload();
  const client = useQueryClient();
  const [typedKey, setTypedKey] = useState("");
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["handover"] });
    void client.invalidateQueries({ queryKey: ["handover-record"] });
  };
  const verifying = turn.status === "IDENTITY_IN_PROGRESS";
  const submission = useLatestSubmission(turn.id, verifying);
  const view = describeTurn(turn, submission.data);
  const hasRecord = turn.status === "READY_TO_ACCEPT" || turn.status === "HANDOVER_COMMITTED";
  // Biên bản cho tên Chủ tài sản và Người thực thi (lượt không có hai tên này); dùng chung một lần tải với khung ký.
  const record = useRecipientRecord(turn.id, hasRecord);
  const executorName = record.data?.executorName;
  const name = turn.container?.name ?? "Lượt bàn giao";
  let sub = "Đã đóng";
  if (view.step !== null) {
    sub = view.step > 6 ? "Đã hoàn tất 6/6 bước" : `Đang ở Bước ${view.step}/6`;
  }
  const grantActive = turn.grant?.status === "ACTIVE";
  const identitySubmitted = verifying && submission.data?.status === "SUBMITTED";
  const redo = verifying && submission.data?.status === "SUPPLEMENT_REQUESTED";
  const keyPending = turn.status === "HANDOVER_COMMITTED" && turn.keyRequired && !turn.keyVerified;
  const downloading =
    turn.status === "HANDOVER_COMMITTED" && !turn.receivedAllAt && !keyPending && grantActive;
  const total = turn.items.length;
  const left = itemsLeft(turn);
  const percent = total === 0 ? 0 : Math.round(((total - left) / total) * 100);
  const allDownloaded = total > 0 && left === 0;

  const start = () =>
    void action.execute(
      () => handoverService.claimTurn(turn.id),
      () => refresh(),
    );

  let main: ReactNode;
  if (turn.status === "INVITED" || turn.status === "INITIAL_RESPONSE_EXPIRED") {
    main = (
      <Hero
        tone="gold"
        eyebrow={
          <>
            <Mail className="size-4" aria-hidden="true" />
            Bước tiếp theo dành cho bạn
          </>
        }
        title="Bạn được mời tiếp nhận phần tài sản này"
        actions={
          <button
            type="button"
            className={buttonStyles.dark}
            disabled={action.pending}
            onClick={start}
          >
            <IdCard className="size-4" aria-hidden="true" />
            {action.pending ? "Đang mở…" : "Bắt đầu xác minh danh tính"}
          </button>
        }
      >
        <p>
          Luật sư đã lập biên bản bàn giao có tên bạn. Để tài sản đến đúng người, bạn nộp ảnh căn
          cước hai mặt cho luật sư đối chiếu, sau đó ký biên bản và tải tài sản về.
        </p>
        {turn.status === "INITIAL_RESPONSE_EXPIRED" ? (
          <p className="mt-3 rounded-xl bg-white/70 px-4 py-3 font-semibold">
            Đã qua hạn phản hồi ban đầu nhưng bạn vẫn có thể nhận lời mời; hệ thống sẽ kiểm tra khi
            bạn xác nhận.
          </p>
        ) : (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-white/70 px-4 py-3 font-semibold text-heritage-warning">
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            {remainingText(turn.responseDeadline, turn.serverTime)} để phản hồi lời mời
          </p>
        )}
      </Hero>
    );
  } else if (verifying && identitySubmitted) {
    main = (
      <Hero
        tone="info"
        eyebrow={
          <>
            <Clock className="size-4" aria-hidden="true" />
            Bước 4: Đang chờ luật sư đối chiếu
          </>
        }
        title="Đã gửi hồ sơ căn cước cho luật sư"
      >
        <p>
          {turn.reviewer ? `Luật sư ${turn.reviewer.fullName}` : "Luật sư"} đang đối chiếu căn cước
          của bạn. Được xác nhận thì bạn chuyển thẳng sang bước ký biên bản, không phải chờ người
          nhận khác.
        </p>
      </Hero>
    );
  } else if (verifying) {
    main = (
      <Panel
        title="Bước 3: Xác minh danh tính bằng căn cước"
        labelledBy="identity-step"
        action={<Chip tone={redo ? "danger" : "warning"}>Cần bạn hoàn thành</Chip>}
      >
        <RecipientIdentityPanel turnId={turn.id} onChanged={refresh} />
      </Panel>
    );
  } else if (turn.status === "READY_TO_ACCEPT") {
    main = <RecipientRecordPanel turnId={turn.id} onChanged={refresh} />;
  } else if (turn.status === "HANDOVER_COMMITTED" && turn.receivedAllAt) {
    main = (
      <Hero
        tone="ok"
        eyebrow={
          <>
            <Check className="size-4" aria-hidden="true" />
            Hoàn tất bàn giao (6/6 bước)
          </>
        }
        title="Bạn đã nhận đủ tài sản và ký phiếu giao nhận"
        actions={<RecipientPaperButtons turnId={turn.id} />}
      >
        <p>
          {`Bạn đã xác nhận nhận đủ lúc ${formatDateTime(turn.receivedAllAt)}. `}
          {turn.receiptExecutorSignedAt
            ? `Người thực thi đã ký bên giao lúc ${formatDateTime(turn.receiptExecutorSignedAt)}. Việc giao nhận đã hoàn tất.`
            : "Đang chờ Người thực thi ký bên giao."}
        </p>
      </Hero>
    );
  } else if (turn.status === "HANDOVER_COMMITTED") {
    main = (
      <>
        {keyPending && (
          <Hero
            tone="gold"
            eyebrow={
              <>
                <KeyRound className="size-4" aria-hidden="true" />
                Bước 6A: Mở khóa tải tài sản
              </>
            }
            title="Nhập mã nhận từ Người thực thi"
          >
            <p>
              Biên bản đã đủ ba chữ ký.{" "}
              {executorName ? `Người thực thi (${executorName})` : "Người thực thi"} gửi mã nhận vào
              email của bạn. Nhập mã vào ô dưới để mở khóa tải xuống.
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <label className="sr-only" htmlFor={`key-${turn.id}`}>
                Mã nhận do Người thực thi đưa
              </label>
              <input
                id={`key-${turn.id}`}
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={typedKey}
                disabled={action.pending}
                onChange={(event) => setTypedKey(event.target.value)}
                className="h-12 min-w-0 flex-[1_1_200px] rounded-xl border-2 border-heritage-gold bg-white px-3.5 font-mono text-base font-bold uppercase tracking-widest"
              />
              <button
                type="button"
                className={buttonStyles.dark}
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
                <Lock className="size-4" aria-hidden="true" />
                Xác nhận khóa
              </button>
            </div>
            <p className="mt-2.5 text-xs text-heritage-muted">
              Chưa thấy thư thì liên hệ trực tiếp Người thực thi của kho. Nhập sai nhiều lần sẽ bị
              khóa.
            </p>
          </Hero>
        )}
        {!keyPending && turn.keyRequired && (
          <p role="status" className="text-sm text-heritage-success">
            Mã nhận đã được xác nhận.
          </p>
        )}
        {downloading && (
          <Panel
            title={`Bước 6B: Tải tài sản về máy (${total - left}/${total} mục)`}
            labelledBy="download-step"
            action={
              <Chip tone={allDownloaded ? "success" : "warning"}>
                {allDownloaded ? "Đã tải đủ tất cả" : `Còn ${left} mục`}
              </Chip>
            }
          >
            <div className="h-2 overflow-hidden rounded bg-heritage-border/60" aria-hidden="true">
              <i
                className="block h-full bg-heritage-success transition-[width] duration-200"
                style={{ width: `${percent}%` }}
              />
            </div>
            <ul className="mt-4 space-y-2.5">
              {turn.items.map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-wrap items-center gap-x-3.5 gap-y-3 rounded-2xl border px-4 py-3.5 ${item.downloaded ? "border-heritage-success-border bg-heritage-success-bg/50" : "border-heritage-border bg-white"}`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${item.downloaded ? "bg-heritage-success-bg text-heritage-success" : "bg-heritage-sunken text-heritage-primary"}`}
                  >
                    {item.downloaded ? (
                      <Check className="size-5" />
                    ) : (
                      <FileText className="size-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-[1_1_200px]">
                    <span className="block break-words text-sm font-semibold text-heritage-primary">
                      {item.name}
                    </span>
                    <span className="block text-sm text-heritage-muted">
                      {kindLabels[item.kind] ?? "Mục"} · {formatStorageSize(item.sizeBytes)} ·{" "}
                      {item.downloaded ? (
                        <span className="font-semibold text-heritage-success">Đã tải xong</span>
                      ) : (
                        "Chưa tải"
                      )}
                    </span>
                  </span>
                  <ActionButton
                    className={item.downloaded ? buttonStyles.outline : buttonStyles.dark}
                    aria-label={`Tải xuống ${item.name}`}
                    pending={content.pending && content.activeKey === item.id}
                    done={content.done}
                    progress={content.activeKey === item.id ? content.percent : null}
                    preparingLabel="Đang chuẩn bị…"
                    pendingLabel="Đang tải"
                    doneLabel="Đã tải xong"
                    disabled={content.pending || action.pending}
                    onClick={() =>
                      void content.download(
                        item.id,
                        (options) => handoverService.download(turn.grant!.id, item.id, options),
                        (item.fileName ?? `${item.name}.txt`).replace(/[^\p{L}\p{N} ._()-]/gu, "_"),
                        refresh,
                      )
                    }
                  >
                    <Download className="size-4" aria-hidden="true" />
                    {item.downloaded ? "Tải lại" : "Tải xuống"}
                  </ActionButton>
                </li>
              ))}
            </ul>
          </Panel>
        )}
        {turn.grant && !keyPending && (
          <Hero
            tone={allDownloaded ? "ok" : "plain"}
            eyebrow={
              <>
                <PenLine className="size-4" aria-hidden="true" />
                Bước 6C: Xác nhận phiếu giao nhận
              </>
            }
            title={
              allDownloaded
                ? "Bạn đã tải đủ tài sản. Ký phiếu giao nhận để hoàn tất"
                : "Tải hết các mục ở trên để mở nút ký phiếu"
            }
          >
            <ReceiptSection turn={turn} onChanged={refresh} />
          </Hero>
        )}
      </>
    );
  } else {
    main = (
      <Hero
        tone="plain"
        eyebrow={
          <>
            <Clock className="size-4" aria-hidden="true" />
            Lượt bàn giao đã kết thúc
          </>
        }
        title={view.chip}
      >
        <p>{TURN_ENDED_HINTS[turn.status] ?? view.nextHint}</p>
      </Hero>
    );
  }

  let grantLine = "";
  if (turn.grant) {
    grantLine = grantLabels[turn.grant.status] ?? turn.grant.status;
    if (GRANT_WITH_DATE.includes(turn.grant.status)) {
      grantLine = `${grantLine} · đến ${formatDateTime(turn.grant.expiresAt)}`;
    }
  }
  const ownerName = record.data?.ownerName;
  return (
    <div className="space-y-5">
      <TurnBar name={name} chip={view.chip} tone={view.tone} sub={sub} />
      {grantActive && turn.grant && turn.status === "HANDOVER_COMMITTED" && !turn.receivedAllAt && (
        <Notice
          tone="warning"
          title={`${remainingText(turn.grant.expiresAt, turn.serverTime)} để tải nội dung`}
        >
          Hết hạn lúc {formatDateTime(turn.grant.expiresAt)}. Sau đó nội dung không còn tải được.
        </Notice>
      )}
      {view.step !== null && (
        <Panel title="Tiến trình bàn giao" labelledBy="turn-progress" className="p-5">
          <HandoverStepper current={view.step} warn={redo} />
        </Panel>
      )}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] xl:items-start">
        <div className="min-w-0 space-y-5">{main}</div>
        <div className="min-w-0 space-y-5">
          {turn.items.length > 0 && !downloading && (
            <Panel
              title="Các mục dành cho bạn"
              labelledBy="turn-items"
              action={<Chip>{`${turn.items.length} mục`}</Chip>}
            >
              <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {turn.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-heritage-border bg-white px-3.5 py-2.5"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-heritage-sunken text-heritage-primary"
                    >
                      <FileText className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold">{item.name}</span>
                      <span className="block text-sm text-heritage-muted">
                        {kindLabels[item.kind] ?? "Mục"} · {formatStorageSize(item.sizeBytes)}
                      </span>
                    </span>
                    {turn.status !== "HANDOVER_COMMITTED" ? (
                      <Chip className="gap-1">
                        <Lock className="size-3.5" aria-hidden="true" />
                        Chờ mở
                      </Chip>
                    ) : item.downloaded ? (
                      <Chip tone="success">Đã tải</Chip>
                    ) : (
                      <Chip tone="warning">{keyPending ? "Cần mã" : "Chưa tải"}</Chip>
                    )}
                  </li>
                ))}
              </ul>
              {turn.status !== "HANDOVER_COMMITTED" && (
                <p className="mt-3 text-sm text-heritage-muted">
                  Mở tải sau khi đủ ba chữ ký (luật sư, Người thực thi và bạn).
                </p>
              )}
            </Panel>
          )}
          <Panel title="Thông tin hồ sơ bàn giao" labelledBy="turn-info">
            <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3.5 gap-y-2.5 text-sm">
              {ownerName && <Row label="Chủ tài sản">{ownerName}</Row>}
              <Row label="Phần để lại">{name}</Row>
              {turn.reviewer && (
                <Row label="Luật sư phụ trách">
                  {turn.reviewer.lawyerCardNumber
                    ? `${turn.reviewer.fullName} (thẻ luật sư ${turn.reviewer.lawyerCardNumber})`
                    : turn.reviewer.fullName}
                </Row>
              )}
              {executorName && <Row label="Người thực thi">{executorName}</Row>}
              <Row label="Ngày mời">{formatDateTime(turn.invitedAt)}</Row>
              {RESPONSE_PHASE.includes(turn.status) && (
                <Row label="Hạn phản hồi">{formatDateTime(turn.responseDeadline)}</Row>
              )}
              {grantLine && <Row label="Thời hạn tải">{grantLine}</Row>}
            </dl>
            {turn.identityBypassed && (
              <p role="status" className="mt-3 text-sm text-heritage-warning">
                Môi trường Development đang bỏ qua bước xác minh danh tính. Đây không phải bằng
                chứng danh tính đã được xác minh.
              </p>
            )}
            {turn.status === "HANDOVER_COMMITTED" && !turn.receivedAllAt && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-heritage-border pt-3.5">
                <RecipientPaperButtons turnId={turn.id} compact />
              </div>
            )}
          </Panel>
        </div>
      </div>
      {(action.pending || content.pending) && <p role="status">Đang xử lý yêu cầu…</p>}
      {(action.error || content.error) && (
        <p
          role="alert"
          className="rounded-xl bg-heritage-danger-bg px-4 py-3 text-sm text-heritage-danger"
        >
          {action.error || content.error}
        </p>
      )}
    </div>
  );
}
