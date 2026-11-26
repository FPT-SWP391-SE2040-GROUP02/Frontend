import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { formatDate } from "@/shared/lib/dateFormat";
import { buttonStyles, Chip, Initial, type Tone } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";
import type { PendingInvitation } from "../model/handover.schema";
import type { TurnGroup } from "../model/turnPresentation";
import { useHandoverAction } from "../model/useHandoverAction";
import { useTurnOverview, type TurnEntry } from "../model/useTurnOverview";
import { MiniStepBar } from "./portalKit";

/** Một dòng việc: chữ cái đầu, tên phần tài sản kèm nhãn, câu gợi ý, thanh bước và nút việc tiếp theo. */
function Row({
  name,
  chip,
  tone,
  urgent,
  hint,
  sub,
  step,
  action,
}: {
  name: string;
  chip: string;
  tone: Tone;
  urgent: boolean;
  hint: string;
  sub: string;
  step: number | null;
  action: ReactNode;
}) {
  return (
    <article
      aria-label={name}
      className={`flex flex-wrap items-center gap-x-[18px] gap-y-3.5 rounded-2xl border bg-heritage-surface px-5 py-[18px] shadow-card transition-colors hover:border-heritage-gold ${urgent ? "border-heritage-gold bg-white" : "border-heritage-border"}`}
    >
      <Initial name={name} className="size-12 shrink-0 text-base" />
      <div className="min-w-0 flex-[1_1_280px]">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <h3 className="break-words text-base font-semibold text-heritage-primary">{name}</h3>
          <Chip tone={tone}>{chip}</Chip>
        </div>
        {hint && <p className="mt-1 text-sm font-semibold">{hint}</p>}
        <p className="mt-0.5 text-sm text-heritage-muted">{sub}</p>
        {step !== null && <MiniStepBar step={step} />}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">{action}</div>
    </article>
  );
}

function stepSub(entry: TurnEntry): string {
  const { turn, view } = entry;
  let progress = "Đã đóng";
  if (view.step !== null) {
    progress = view.step > 6 ? "Đã xong 6/6 bước" : `Bước ${view.step}/6`;
  }
  return `${turn.items.length} mục tài sản · ${progress}`;
}

/** Thư mời chưa nhận: bấm Bắt đầu thì nhận lượt rồi mở thẳng trang các bước. */
function InvitationRow({ invitation }: { invitation: PendingInvitation }) {
  const action = useHandoverAction();
  const client = useQueryClient();
  const navigate = useNavigate();
  const start = () =>
    void action.execute(
      () => handoverService.claimTurn(invitation.turnId),
      (turn) => {
        void client.invalidateQueries({ queryKey: ["handover"] });
        navigate(ROUTES.BENEFICIARY.TURN(turn.id));
      },
    );
  return (
    <div className="space-y-2">
      <Row
        name={invitation.containerName}
        chip="Thư mời mới"
        tone="warning"
        urgent
        hint="Bấm Bắt đầu để nộp căn cước, rồi ký biên bản và nhận tài sản."
        sub={`Chủ kho: ${invitation.ownerFullName} · mời ngày ${formatDate(invitation.invitedAt)}`}
        step={3}
        action={
          <button
            type="button"
            className={buttonStyles.dark}
            disabled={action.pending}
            onClick={start}
          >
            {action.pending ? "Đang mở…" : "Bắt đầu ngay"}
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        }
      />
      {action.error && !action.pending && (
        <p
          role="alert"
          className="rounded-xl bg-heritage-danger-bg px-4 py-3 text-sm text-heritage-danger"
        >
          {action.error}
        </p>
      )}
    </div>
  );
}

function TurnRow({ entry }: { entry: TurnEntry }) {
  const { turn, view } = entry;
  const name = turn.container?.name ?? "Lượt bàn giao";
  return (
    <Row
      name={name}
      chip={view.chip}
      tone={view.tone}
      urgent={view.group === "urgent"}
      hint={view.nextHint}
      sub={stepSub(entry)}
      step={view.step}
      action={
        <Link
          to={ROUTES.BENEFICIARY.TURN(turn.id)}
          className={view.group === "urgent" ? buttonStyles.dark : buttonStyles.outline}
        >
          {view.actionLabel}
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      }
    />
  );
}

function Group({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-heritage-muted">
        {icon}
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Kpi({
  icon,
  tone,
  count,
  label,
}: {
  icon: ReactNode;
  tone: "warn" | "info" | "ok";
  count: number;
  label: string;
}) {
  const tones = {
    warn: "bg-heritage-warning-bg text-heritage-warning",
    info: "bg-heritage-sunken text-heritage-primary",
    ok: "bg-heritage-success-bg text-heritage-success",
  };
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-heritage-border bg-heritage-surface px-[18px] py-4 shadow-card">
      <span
        aria-hidden="true"
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        {icon}
      </span>
      <div>
        <b className="block text-2xl font-semibold leading-tight text-heritage-primary tabular-nums">
          {count}
        </b>
        <span className="text-sm text-heritage-muted">{label}</span>
      </div>
    </div>
  );
}

/**
 * Trang "Việc cần làm" của người nhận: ba ô tóm tắt, rồi các phần tài sản chia theo nhóm (cần bạn làm ngay, đang chờ
 * luật sư hoặc Người thực thi, đã hoàn tất, đã kết thúc). `notice` là thông báo phía trên danh sách (ví dụ giấy tờ cần
 * bổ sung) do trang ghép vào.
 */
export function TurnHub({ notice }: { notice?: ReactNode }) {
  const overview = useTurnOverview();
  if (overview.isPending) return <p role="status">Đang tải các lượt bàn giao…</p>;
  if (overview.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="rounded-xl bg-heritage-danger-bg px-4 py-3 text-sm text-heritage-danger">
          Không tải được các lượt của bạn. Vui lòng thử lại.
        </p>
        <button type="button" className={buttonStyles.outline} onClick={overview.refetch}>
          Thử lại
        </button>
      </div>
    );
  }
  const inGroup = (group: TurnGroup) => overview.entries.filter((e) => e.view.group === group);
  const urgent = inGroup("urgent");
  const waiting = inGroup("waiting");
  const done = inGroup("done");
  const ended = inGroup("ended");
  const empty = overview.entries.length === 0 && overview.invitations.length === 0;
  return (
    <div className="space-y-6">
      <div className="grid gap-3.5 lg:grid-cols-3">
        <Kpi
          icon={<AlertTriangle className="size-5" />}
          tone="warn"
          count={overview.urgentCount}
          label="Cần bạn thao tác ngay"
        />
        <Kpi
          icon={<Clock className="size-5" />}
          tone="info"
          count={waiting.length}
          label="Đang chờ luật sư hoặc Người thực thi"
        />
        <Kpi
          icon={<CheckCircle2 className="size-5" />}
          tone="ok"
          count={done.length}
          label="Đã nhận tài sản hoàn tất"
        />
      </div>
      {notice}
      {empty && (
        <div className="space-y-2">
          <p role="status">Hiện chưa có tài sản nào chờ bạn trên tài khoản này.</p>
          <p className="text-sm text-heritage-muted">
            Nếu bạn vừa nhận thư mời, hãy đăng nhập bằng đúng email ghi trong thư.
          </p>
        </div>
      )}
      {(urgent.length > 0 || overview.invitations.length > 0) && (
        <Group
          icon={<Sparkles className="size-4" aria-hidden="true" />}
          title={`Cần bạn thao tác ngay (${urgent.length + overview.invitations.length})`}
        >
          {overview.invitations.map((invitation) => (
            <InvitationRow key={invitation.turnId} invitation={invitation} />
          ))}
          {urgent.map((entry) => (
            <TurnRow key={entry.turn.id} entry={entry} />
          ))}
        </Group>
      )}
      {waiting.length > 0 && (
        <Group
          icon={<Clock className="size-4" aria-hidden="true" />}
          title={`Đang chờ luật sư hoặc Người thực thi (${waiting.length})`}
        >
          {waiting.map((entry) => (
            <TurnRow key={entry.turn.id} entry={entry} />
          ))}
        </Group>
      )}
      {done.length > 0 && (
        <Group
          icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
          title={`Đã hoàn tất bàn giao (${done.length})`}
        >
          {done.map((entry) => (
            <TurnRow key={entry.turn.id} entry={entry} />
          ))}
        </Group>
      )}
      {ended.length > 0 && (
        <Group
          icon={<Clock className="size-4" aria-hidden="true" />}
          title={`Đã kết thúc (${ended.length})`}
        >
          {ended.map((entry) => (
            <TurnRow key={entry.turn.id} entry={entry} />
          ))}
        </Group>
      )}
      <button
        type="button"
        className={buttonStyles.outline}
        disabled={overview.isFetching}
        onClick={overview.refetch}
      >
        <RefreshCw
          className={`size-4 ${overview.isFetching ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        Tải lại lượt bàn giao
      </button>
    </div>
  );
}
