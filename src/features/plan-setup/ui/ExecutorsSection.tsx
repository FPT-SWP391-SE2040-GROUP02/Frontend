import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Lock, X } from "lucide-react";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { inviteExecutorSchema, type executorSchema } from "../model/planSetup.schema";
import { planSetupService } from "../api/planSetupService";
import { usePlanSetup } from "../model/usePlanSetup";

type Executor = z.infer<typeof executorSchema>;
type ExecutorRole = Executor["role"];
type Beneficiary = { id: string; label: string };

/** Hộp thoại đang mở: mời (role null = Chủ kho tự chọn vai), mời người thay, hoặc thu hồi. */
type DialogState =
  | { kind: "invite"; role: ExecutorRole | null; replacing: Executor | null }
  | { kind: "revoke"; executor: Executor }
  | null;

const statuses = {
  INVITED: "Chờ phản hồi",
  ACCEPTED: "Đã chấp nhận",
  DECLINED: "Đã từ chối",
  EXPIRED: "Hết hạn",
  REVOKED: "Đã thu hồi",
  SUSPENDED: "Cần chấp nhận lại",
};

/** Kế hoạch ở các trạng thái này thì Backend chặn mời, gửi lại và thu hồi Executor (SETUP-21). */
const LOCKED_PLAN_STATUSES = ["DEATH_CASE_OPEN", "HANDOVER_IN_PROGRESS", "BLOCKED", "CLOSED"];
const RUNNING_PLAN_STATUSES = ["ACTIVE", "CHECKIN_OVERDUE", "AWAITING_CHECK"];
const PLAN_CHIP_LABELS: Record<string, string> = {
  DRAFT: "Đang nháp",
  ACTIVE: "Đang hoạt động",
  CHECKIN_OVERDUE: "Đang hoạt động",
  AWAITING_CHECK: "Đang hoạt động",
  DEATH_CASE_OPEN: "Có hồ sơ báo tử",
  HANDOVER_IN_PROGRESS: "Đang bàn giao",
  BLOCKED: "Đang bị chặn",
  CLOSED: "Đã đóng",
};

const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6";
const GOLD_BUTTON = "bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]";
const ALLOWED_ACTIONS = ["Báo tin cho hệ thống", "Theo dõi tiến trình bàn giao"];
const FORBIDDEN_ACTIONS = ["Đọc nội dung kho", "Tự duyệt hồ sơ"];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(value));
}

function isLive(executor: Executor): boolean {
  return (
    executor.status === "INVITED" ||
    executor.status === "ACCEPTED" ||
    executor.status === "SUSPENDED"
  );
}

/** Người đang giữ vai: ưu tiên người đã chấp nhận (người thay đang chờ không thay họ cho tới khi chấp nhận). */
function currentHolder(executors: Executor[], role: ExecutorRole): Executor | null {
  let holder: Executor | null = null;
  for (const executor of executors) {
    if (executor.role !== role || !isLive(executor)) {
      continue;
    }
    if (holder === null || executor.status === "ACCEPTED") {
      holder = executor;
    }
  }
  return holder;
}

/** Lời mời thay đang chờ phản hồi của vai chính (khác người đang giữ vai). */
function pendingReplacement(executors: Executor[], holder: Executor | null): Executor | null {
  for (const executor of executors) {
    if (executor.role === "PRIMARY" && executor.status === "INVITED" && executor !== holder) {
      return executor;
    }
  }
  return null;
}

function ActionList({
  title,
  items,
  allowed,
}: {
  title: string;
  items: string[];
  allowed: boolean;
}) {
  let titleColor = "text-red-700";
  let mark: ReactNode = <X className="size-4 text-red-700" aria-hidden="true" />;
  if (allowed) {
    titleColor = "text-green-700";
    mark = <Check className="size-4 text-green-700" aria-hidden="true" />;
  }
  const rows: ReactNode[] = [];
  for (const item of items) {
    rows.push(
      <li key={item} className="flex items-center gap-3 text-sm">
        {mark}
        {item}
      </li>,
    );
  }
  return (
    <div className="mt-5">
      <p className={`text-xs font-semibold ${titleColor}`}>{title}</p>
      <ul className="mt-3 space-y-2">{rows}</ul>
    </div>
  );
}

interface InviteDialogProps {
  vaultId: string;
  role: ExecutorRole | null;
  replacing: Executor | null;
  beneficiaries: Beneficiary[];
  sync: () => void;
  onClose: () => void;
}

function InviteDialog({
  vaultId,
  role,
  replacing,
  beneficiaries,
  sync,
  onClose,
}: InviteDialogProps) {
  const action = usePrivateAction();
  let defaultRole: ExecutorRole = "PRIMARY";
  if (role !== null) {
    defaultRole = role;
  }
  const form = useForm<z.infer<typeof inviteExecutorSchema>>({
    resolver: zodResolver(inviteExecutorSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { email: "", role: defaultRole, beneficiaryId: null },
  });
  let title = "Mời người thực hiện";
  let description = "Người được mời sẽ nhận email để chấp nhận nhiệm vụ.";
  let notice = "Lời mời có hiệu lực 7 ngày.";
  if (replacing !== null) {
    title = `Mời người thay ${replacing.inviteeEmail}`;
    description = `Người mới sẽ là người thực hiện chính khi chấp nhận lời mời. Đến lúc đó ${replacing.inviteeEmail} tự động thành “Đã thu hồi”. Trong lúc chờ, người cũ vẫn giữ vai trò.`;
    notice = `Lời mời có hiệu lực 7 ngày. Hết hạn mà chưa chấp nhận thì ${replacing.inviteeEmail} vẫn là người chính.`;
  } else if (role === "BACKUP") {
    title = "Mời người dự phòng";
  } else if (role === "PRIMARY") {
    title = "Mời người thực hiện chính";
  }
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            const done = await action.execute(() => planSetupService.invite(vaultId, values), sync);
            if (done) {
              onClose();
            }
          })}
        >
          <fieldset disabled={action.pending} className="space-y-4">
            <label className="block space-y-2 text-sm">
              Email Executor
              <Input
                type="email"
                {...form.register("email")}
                aria-invalid={Boolean(form.formState.errors.email)}
              />
            </label>
            {form.formState.errors.email && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
            {role === null && (
              <label className="block space-y-2 text-sm">
                Vai trò Executor
                <select
                  {...form.register("role")}
                  className="block min-h-11 w-full rounded-lg border px-3"
                >
                  <option value="PRIMARY">Executor chính</option>
                  <option value="BACKUP">Executor dự phòng</option>
                </select>
              </label>
            )}
            <label className="block space-y-2 text-sm">
              Người này có nhận tài sản trong kho không?
              <select
                className="block min-h-11 w-full rounded-lg border px-3"
                {...form.register("beneficiaryId", {
                  setValueAs: (value: unknown) => {
                    if (typeof value === "string") {
                      const trimmed = value.trim();
                      if (trimmed !== "") {
                        return trimmed;
                      }
                    }
                    return null;
                  },
                })}
              >
                <option value="">Không, người này không nhận tài sản</option>
                {beneficiaries.map((item) => (
                  <option key={item.id} value={item.id}>
                    Có, người nhận: {item.label}
                  </option>
                ))}
              </select>
              <span className="block text-xs text-heritage-muted">
                Nếu có, kho cần thêm một người dự phòng độc lập không nhận tài sản.
              </span>
            </label>
            {form.formState.errors.beneficiaryId && (
              <p role="alert" className="text-sm text-destructive">
                Chọn hồ sơ người nhận hợp lệ thuộc kho.
              </p>
            )}
          </fieldset>
          <p className="rounded-lg bg-[#F1E7D0] p-3 text-sm text-[#7A5B24]">{notice}</p>
          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
          <DialogFooter>
            <Button
              size="lg"
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={action.pending}
            >
              Hủy
            </Button>
            <Button size="lg" type="submit" className={GOLD_BUTTON} disabled={action.pending}>
              Gửi lời mời
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RevokeDialog({
  vaultId,
  executor,
  sync,
  onClose,
}: {
  vaultId: string;
  executor: Executor;
  sync: () => void;
  onClose: () => void;
}) {
  const action = usePrivateAction();
  let roleLabel = "người thực hiện chính";
  if (executor.role === "BACKUP") {
    roleLabel = "người thực hiện dự phòng";
  }
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thu hồi {executor.inviteeEmail}?</DialogTitle>
          <DialogDescription>
            {executor.inviteeEmail} sẽ không còn là {roleLabel} của kho này.
          </DialogDescription>
        </DialogHeader>
        {action.error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {action.error}
          </p>
        )}
        <DialogFooter>
          <Button
            size="lg"
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={action.pending}
          >
            Đóng
          </Button>
          <Button
            size="lg"
            type="button"
            variant="destructive"
            disabled={action.pending}
            onClick={() =>
              void action.execute(
                () => planSetupService.revoke(vaultId, executor.id, executor.etag),
                () => {
                  sync();
                  onClose();
                },
              )
            }
          >
            Thu hồi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RoleCardProps {
  title: string;
  role: ExecutorRole;
  holder: Executor | null;
  pending: Executor | null;
  manageable: boolean;
  planRunning: boolean;
  scopeVersion: string;
  busy: boolean;
  onInvite: (role: ExecutorRole, replacing: Executor | null) => void;
  onRevoke: (executor: Executor) => void;
  onResend: (executor: Executor) => void;
}

function RoleCard(props: RoleCardProps) {
  const { title, role, holder, pending, manageable, planRunning, scopeVersion, busy } = props;
  if (holder === null) {
    let hint = "Người thực hiện chính báo tin khi bạn qua đời và theo dõi tiến trình.";
    let buttonLabel = "Mời người thực hiện chính";
    if (role === "BACKUP") {
      hint =
        "Người dự phòng có quyền như người chính. Nên mời một người khác, để nếu cần thì kế hoạch không bị kẹt.";
      buttonLabel = "Mời người dự phòng";
    }
    return (
      <section aria-label={title} className={CARD}>
        <h2 className="text-xl font-medium text-heritage-primary">{title}</h2>
        <div className="mt-4 flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-heritage-canvas font-semibold text-heritage-muted"
            aria-hidden="true"
          >
            ?
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Chưa mời</p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Còn thiếu
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-heritage-muted">{hint}</p>
        {manageable && (
          <Button
            size="lg"
            className={`${GOLD_BUTTON} mt-5 w-full justify-between`}
            disabled={busy}
            onClick={() => props.onInvite(role, null)}
          >
            {buttonLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        )}
      </section>
    );
  }
  let description = "Người báo tin khi bạn qua đời và theo dõi tiến trình.";
  if (role === "BACKUP") {
    description = "Thay người thực hiện chính khi họ không báo tin được.";
  }
  let beneficiaryNote = "Người này không nhận tài sản trong kho này.";
  if (holder.isBeneficiary) {
    beneficiaryNote = "Người này cũng là người nhận trong kho này.";
  }
  let dateLine = `Lời mời hết hạn ngày ${formatDate(holder.expiresAt)}`;
  if (holder.acceptedAt !== null) {
    dateLine = `Chấp nhận lời mời ngày ${formatDate(holder.acceptedAt)}`;
  }
  const needsResend =
    holder.status === "INVITED" ||
    holder.status === "SUSPENDED" ||
    (holder.status === "ACCEPTED" && holder.acceptedScopeVersion !== scopeVersion);
  // Người chính đã nhận nhiệm vụ khi kế hoạch chạy: Backend yêu cầu mời người thay, không thu hồi trực tiếp.
  const mustReplace = role === "PRIMARY" && holder.status === "ACCEPTED" && planRunning;
  return (
    <section aria-label={title} className={CARD}>
      <h2 className="text-xl font-medium text-heritage-primary">{title}</h2>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E0C486] font-semibold text-[#0A281E]"
            aria-hidden="true"
          >
            {holder.inviteeEmail.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="break-words font-semibold">{holder.inviteeEmail}</p>
            <p className="text-xs text-heritage-muted">{dateLine}</p>
          </div>
        </div>
        <span className="rounded-full bg-heritage-primary/10 px-3 py-1 text-xs font-semibold text-heritage-primary">
          {statuses[holder.status]}
        </span>
      </div>
      {holder.status === "INVITED" && !holder.invitationSentAt && (
        <p role="status" className="mt-3 text-sm text-amber-800">
          Chưa xác nhận gửi được email. Cần cấu hình SMTP và bật gửi lời mời; người được mời chưa
          thể nhận nhiệm vụ từ email này.
        </p>
      )}
      <p className="mt-4 text-sm leading-6">
        {description} {beneficiaryNote}
      </p>
      {pending !== null && (
        <p className="mt-3 rounded-lg bg-[#F1E7D0] p-3 text-sm text-[#7A5B24]">
          Đã mời người thay: {pending.inviteeEmail} · {statuses[pending.status]}. Người hiện tại vẫn
          giữ vai trò đến khi người mới chấp nhận.
        </p>
      )}
      <ActionList title="Được làm" items={ALLOWED_ACTIONS} allowed />
      <ActionList title="Không được làm" items={FORBIDDEN_ACTIONS} allowed={false} />
      {manageable && (
        <div className="mt-6 flex flex-wrap gap-3">
          {role === "PRIMARY" && holder.status === "ACCEPTED" && (
            <Button
              size="lg"
              className={GOLD_BUTTON}
              disabled={busy}
              onClick={() => props.onInvite("PRIMARY", holder)}
            >
              Mời người thay
            </Button>
          )}
          {needsResend && (
            <Button
              size="lg"
              variant="outline"
              disabled={busy}
              onClick={() => props.onResend(holder)}
            >
              Gửi lại lời mời
            </Button>
          )}
          {!mustReplace && (
            <Button
              size="lg"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              disabled={busy}
              onClick={() => props.onRevoke(holder)}
            >
              Thu hồi
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

function RecentActivity({ executors }: { executors: Executor[] }) {
  const events: { key: string; text: string; at: string }[] = [];
  for (const executor of executors) {
    if (executor.acceptedAt !== null) {
      events.push({
        key: `${executor.id}-accepted`,
        text: `${executor.inviteeEmail} chấp nhận lời mời`,
        at: executor.acceptedAt,
      });
    }
    if (executor.invitationSentAt !== null) {
      events.push({
        key: `${executor.id}-sent`,
        text: `Bạn gửi lời mời cho ${executor.inviteeEmail}`,
        at: executor.invitationSentAt,
      });
    }
  }
  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const rows: ReactNode[] = [];
  for (const event of events.slice(0, 5)) {
    rows.push(
      <li key={event.key} className="border-b border-heritage-border py-3 last:border-b-0">
        <p className="text-sm font-semibold">{event.text}</p>
        <p className="text-xs text-heritage-muted">{formatDate(event.at)}</p>
      </li>,
    );
  }
  return (
    <section aria-label="Hoạt động gần đây" className={CARD}>
      <h2 className="text-xl font-medium text-heritage-primary">Hoạt động gần đây</h2>
      {rows.length === 0 && (
        <p className="mt-4 text-sm text-heritage-muted">Chưa có hoạt động nào.</p>
      )}
      <ul className="mt-2">{rows}</ul>
    </section>
  );
}

/**
 * Màn "Người tin cậy" theo thiết kế: Người thực hiện chính/dự phòng do Chủ kho mời; Người xét duyệt do hệ thống phân công.
 * Mọi thao tác (mời, mời thay, gửi lại, thu hồi) do Chủ kho chủ động; kết quả và điều kiện do Backend quyết định.
 */
export function ExecutorsSection({
  vaultId,
  beneficiaries = [],
}: {
  vaultId: string;
  beneficiaries?: Beneficiary[];
}) {
  const query = usePlanSetup(vaultId);
  const client = useQueryClient();
  const resendAction = usePrivateAction();
  const [dialog, setDialog] = useState<DialogState>(null);

  function sync(): void {
    void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
  }

  function resend(executor: Executor): void {
    void resendAction.execute(
      () => planSetupService.resend(vaultId, executor.id, executor.etag),
      sync,
    );
  }

  if (query.isPending) {
    return <p role="status">Đang tải người tin cậy…</p>;
  }
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không tải được danh sách người tin cậy.</p>
        <Button size="lg" onClick={() => void query.refetch()} disabled={query.isFetching}>
          Thử lại
        </Button>
      </div>
    );
  }
  const setup = query.data;
  const manageable = !LOCKED_PLAN_STATUSES.includes(setup.planStatus);
  const planRunning = RUNNING_PLAN_STATUSES.includes(setup.planStatus);
  const primary = currentHolder(setup.executors, "PRIMARY");
  const backup = currentHolder(setup.executors, "BACKUP");
  const replacement = pendingReplacement(setup.executors, primary);
  let chipLabel = "Đang nháp";
  if (Object.hasOwn(PLAN_CHIP_LABELS, setup.planStatus)) {
    chipLabel = PLAN_CHIP_LABELS[setup.planStatus];
  }
  let banner: ReactNode = null;
  if (!manageable) {
    banner =
      "Kế hoạch đang có hồ sơ báo tử hoặc đang bàn giao nên chưa thể mời, gửi lại hay thu hồi người thực hiện. Bạn chỉ xem được.";
  } else if (planRunning) {
    banner =
      "Kế hoạch đang hoạt động. Bạn vẫn mời, gửi lại và thu hồi được. Người thực hiện chính đã nhận nhiệm vụ không thu hồi trực tiếp: hãy mời người thay, người cũ giữ vai trò tới khi người mới chấp nhận.";
  }
  const busy = resendAction.pending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          {chipLabel}
        </span>
        {manageable && (
          <Button
            size="lg"
            className={GOLD_BUTTON}
            disabled={busy}
            onClick={() => setDialog({ kind: "invite", role: null, replacing: null })}
          >
            Mời người thực hiện
          </Button>
        )}
      </div>
      {banner !== null && (
        <p role="status" className="rounded-xl bg-[#F1E7D0] px-4 py-3 text-sm text-[#7A5B24]">
          {banner}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <RoleCard
          title="Người thực hiện chính"
          role="PRIMARY"
          holder={primary}
          pending={replacement}
          manageable={manageable}
          planRunning={planRunning}
          scopeVersion={setup.executorScopeVersion}
          busy={busy}
          onInvite={(role, replacing) => setDialog({ kind: "invite", role, replacing })}
          onRevoke={(executor) => setDialog({ kind: "revoke", executor })}
          onResend={resend}
        />
        <RoleCard
          title="Người thực hiện dự phòng"
          role="BACKUP"
          holder={backup}
          pending={null}
          manageable={manageable}
          planRunning={planRunning}
          scopeVersion={setup.executorScopeVersion}
          busy={busy}
          onInvite={(role, replacing) => setDialog({ kind: "invite", role, replacing })}
          onRevoke={(executor) => setDialog({ kind: "revoke", executor })}
          onResend={resend}
        />
      </div>
      {resendAction.pending && <p role="status">Đang gửi yêu cầu…</p>}
      {resendAction.error && (
        <div role="alert" className="space-y-3 text-destructive">
          <p>{resendAction.error}</p>
          <Button size="lg" variant="outline" onClick={sync}>
            Tải lại điều kiện
          </Button>
        </div>
      )}
      <p className="text-sm leading-6">{setup.executorScopeText}</p>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-label="Vì sao có người xét duyệt riêng" className={CARD}>
          <h2 className="text-xl font-medium text-heritage-primary">
            Vì sao có người xét duyệt riêng?
          </h2>
          <p className="mt-3 text-sm leading-6 text-heritage-muted">
            Người báo tin và người xét duyệt là hai người khác nhau. Người xét duyệt là nhân viên do
            hệ thống hoặc quản trị viên phân công, bạn không mời và không thấy họ. Mỗi lần bàn giao
            còn có 72 giờ để bạn lên tiếng và bước xác minh eKYC cho người nhận.
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs text-heritage-muted">
            <Lock className="size-4 shrink-0" aria-hidden="true" />
            Nội dung kho được mã hóa trên máy chủ. Không ai trong nhóm này đọc được.
          </p>
        </section>
        <RecentActivity executors={setup.executors} />
      </div>
      {dialog !== null && dialog.kind === "invite" && (
        <InviteDialog
          vaultId={vaultId}
          role={dialog.role}
          replacing={dialog.replacing}
          beneficiaries={beneficiaries}
          sync={sync}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog !== null && dialog.kind === "revoke" && (
        <RevokeDialog
          vaultId={vaultId}
          executor={dialog.executor}
          sync={sync}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
