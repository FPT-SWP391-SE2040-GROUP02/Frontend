import { useMemo, useState, type ReactNode } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, X } from "lucide-react";
import { z } from "zod";
import { formatDate } from "@/shared/lib/dateFormat";
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
import type { AuthState } from "@/entities/user/model/authSlice";
import { inviteExecutorSchema, type executorSchema } from "../model/planSetup.schema";
import { planSetupService } from "../api/planSetupService";
import { usePlanSetup } from "../model/usePlanSetup";

type Executor = z.infer<typeof executorSchema>;
type Beneficiary = { id: string; label: string };

/** Hộp thoại đang mở: mời, mời người thay, hoặc thu hồi. */
type DialogState =
  { kind: "invite"; replacing: Executor | null } | { kind: "revoke"; executor: Executor } | null;

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

/** Lý do khóa ở đầu câu thông báo chỉ xem (thiết kế 186). */
const LOCKED_REASONS: Record<string, string> = {
  DEATH_CASE_OPEN: "Kế hoạch đang có hồ sơ báo tử",
  HANDOVER_IN_PROGRESS: "Kế hoạch đang bàn giao",
  BLOCKED: "Kế hoạch đang bị chặn",
  CLOSED: "Kế hoạch đã đóng",
};

const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6";
const GOLD_BUTTON =
  "bg-heritage-gold-soft font-semibold text-heritage-on-gold shadow-none hover:bg-heritage-gold-soft-hover";
const ALLOWED_ACTIONS = ["Báo tin cho hệ thống", "Theo dõi tiến trình bàn giao"];
const FORBIDDEN_ACTIONS = ["Đọc nội dung kho", "Tự duyệt hồ sơ"];

function isLive(executor: Executor): boolean {
  return (
    executor.status === "INVITED" ||
    executor.status === "ACCEPTED" ||
    executor.status === "SUSPENDED"
  );
}

/** Người đang giữ vai: ưu tiên người đã chấp nhận (người thay đang chờ không thay họ cho tới khi chấp nhận). */
function currentHolder(executors: Executor[]): Executor | null {
  let holder: Executor | null = null;
  for (const executor of executors) {
    if (!isLive(executor)) {
      continue;
    }
    if (holder === null || executor.status === "ACCEPTED") {
      holder = executor;
    }
  }
  return holder;
}

/** Lời mời thay đang chờ phản hồi (khác người đang giữ vai). */
function pendingReplacement(executors: Executor[], holder: Executor | null): Executor | null {
  for (const executor of executors) {
    if (executor.status === "INVITED" && executor !== holder) {
      return executor;
    }
  }
  return null;
}

function ActionList({
  title,
  items,
  allowed,
  readOnly = false,
}: {
  title: string;
  items: string[];
  allowed: boolean;
  /** Chế độ chỉ xem (thiết kế 186): chữ màu theo nhóm, tiêu đề đậm hơn, vẫn có biểu tượng. */
  readOnly?: boolean;
}) {
  let titleColor = "text-red-700";
  let mark: ReactNode = <X className="size-4 text-red-700" aria-hidden="true" />;
  if (allowed) {
    titleColor = "text-green-700";
    mark = <Check className="size-4 text-green-700" aria-hidden="true" />;
  }
  const rows: ReactNode[] = [];
  for (const item of items) {
    // Chế độ chỉ xem vẫn có biểu tượng để phân biệt nhóm khi không chỉ dựa vào màu chữ.
    const rowTone = readOnly ? `font-medium ${titleColor}` : "";
    rows.push(
      <li key={item} className={`flex items-center gap-3 text-sm ${rowTone}`}>
        {mark}
        {item}
      </li>,
    );
  }
  if (readOnly) {
    return (
      <div className="mt-5">
        <p className={`text-sm font-semibold ${titleColor}`}>{title}</p>
        <ul className="mt-3 space-y-2">{rows}</ul>
      </div>
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
  replacing: Executor | null;
  existingExecutors: Executor[];
  sync: () => void;
  onSuccess?: (result: Executor) => void;
  onClose: () => void;
}

function InviteDialog({
  vaultId,
  replacing,
  existingExecutors,
  sync,
  onSuccess,
  onClose,
}: InviteDialogProps) {
  const action = usePrivateAction();
  const ownerEmail = useSelector((state: { auth: AuthState }) => state.auth.user?.email);

  const inviteSchema = useMemo(
    () =>
      inviteExecutorSchema.superRefine((data, ctx) => {
        const email = data.email.trim().toLowerCase();
        if (ownerEmail && email === ownerEmail.trim().toLowerCase()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["email"],
            message: "Bạn không thể tự mời chính mình làm Người thực hiện.",
          });
          return;
        }
        if (replacing && email === replacing.inviteeEmail.trim().toLowerCase()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["email"],
            message: "Người thay thế phải có email khác với Người thực hiện hiện tại.",
          });
          return;
        }
        const duplicate = existingExecutors.find(
          (e) =>
            e.inviteeEmail.trim().toLowerCase() === email &&
            (e.status === "INVITED" || e.status === "ACCEPTED" || e.status === "SUSPENDED") &&
            (!replacing || e.id !== replacing.id),
        );
        if (duplicate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["email"],
            message: "Email này đã được mời hoặc đang là Người thực hiện.",
          });
        }
      }),
    [ownerEmail, existingExecutors, replacing],
  );

  const form = useForm<z.infer<typeof inviteExecutorSchema>>({
    resolver: zodResolver(inviteSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { email: "", beneficiaryId: null },
  });
  let title = "Mời người thực hiện";
  let description = "Người được mời sẽ nhận email để chấp nhận nhiệm vụ.";
  let notice = "Lời mời có hiệu lực 7 ngày.";
  if (replacing !== null) {
    title = `Mời người thay ${replacing.inviteeEmail}`;
    description = `Người mới sẽ là người thực hiện khi chấp nhận lời mời. Đến lúc đó ${replacing.inviteeEmail} tự động thành “Đã thu hồi”. Trong lúc chờ, người cũ vẫn giữ vai trò.`;
    notice = `Lời mời có hiệu lực 7 ngày. Hết hạn mà chưa chấp nhận thì ${replacing.inviteeEmail} vẫn là người thực hiện.`;
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
            const done = await action.execute(
              () => planSetupService.invite(vaultId, values),
              (result) => {
                onSuccess?.(result);
                sync();
              },
            );
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
                placeholder="nguoiduocmoi@example.com"
                {...form.register("email")}
                aria-invalid={Boolean(form.formState.errors.email)}
              />
            </label>
            {form.formState.errors.email && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </fieldset>
          <p className="rounded-lg bg-heritage-warning-bg p-3 text-sm text-heritage-warning">
            {notice}
          </p>
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
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thu hồi {executor.inviteeEmail}?</DialogTitle>
          <DialogDescription>
            {executor.inviteeEmail} sẽ không còn là người thực hiện của kho này.
          </DialogDescription>
        </DialogHeader>
        <p className="rounded-lg bg-heritage-warning-bg p-3 text-sm text-heritage-warning">
          Hồ sơ đang xử lý (nếu có) sẽ được giữ nguyên.
        </p>
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
  holder: Executor | null;
  pending: Executor | null;
  manageable: boolean;
  planRunning: boolean;
  scopeVersion: string;
  busy: boolean;
  onInvite: (replacing: Executor | null) => void;
  onRevoke: (executor: Executor) => void;
  onResend: (executor: Executor) => void;
}

function RoleCard(props: RoleCardProps) {
  const { title, holder, pending, manageable, planRunning, scopeVersion, busy } = props;
  if (holder === null) {
    const hint = "Người thực hiện báo tin khi bạn qua đời và theo dõi tiến trình.";
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
            onClick={() => props.onInvite(null)}
          >
            Mời người thực hiện
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        )}
      </section>
    );
  }
  const description = "Người báo tin khi bạn qua đời và theo dõi tiến trình.";
  let beneficiaryNote = "Người này không nhận tài sản trong kho này.";
  if (holder.isBeneficiary) {
    beneficiaryNote = "Người này cũng là người nhận trong kho này.";
  }
  let dateLine = `Lời mời còn hiệu lực đến ngày ${formatDate(holder.expiresAt)}`;
  if (holder.acceptedAt !== null) {
    dateLine = `Chấp nhận lời mời ngày ${formatDate(holder.acceptedAt)}`;
  }
  const needsResend =
    holder.status === "INVITED" ||
    holder.status === "SUSPENDED" ||
    (holder.status === "ACCEPTED" && holder.acceptedScopeVersion !== scopeVersion);
  // Người thực hiện đã nhận nhiệm vụ khi kế hoạch chạy: Backend yêu cầu mời người thay, không thu hồi trực tiếp.
  const mustReplace = holder.status === "ACCEPTED" && planRunning;
  let statusChipClass = "bg-heritage-primary/10 text-heritage-primary";
  if (holder.status === "ACCEPTED") {
    statusChipClass = "bg-green-100 text-green-800";
  }
  return (
    <section aria-label={title} className={CARD}>
      <h2 className="text-xl font-medium text-heritage-primary">{title}</h2>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-heritage-gold-soft font-semibold text-heritage-on-gold"
            aria-hidden="true"
          >
            {holder.inviteeEmail.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="break-words font-semibold">{holder.inviteeEmail}</p>
            <p className="text-xs text-heritage-muted">{dateLine}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusChipClass}`}>
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
        <p className="mt-3 rounded-lg bg-heritage-warning-bg p-3 text-sm text-heritage-warning">
          Đã mời người thay: {pending.inviteeEmail} · {statuses[pending.status]}. Người hiện tại vẫn
          giữ vai trò đến khi người mới chấp nhận.
        </p>
      )}
      <ActionList title="Được làm" items={ALLOWED_ACTIONS} allowed readOnly={!manageable} />
      <ActionList
        title="Không được làm"
        items={FORBIDDEN_ACTIONS}
        allowed={false}
        readOnly={!manageable}
      />
      {manageable && (
        <div className="mt-6 flex flex-wrap gap-3">
          {holder.status === "ACCEPTED" && (
            <Button
              size="lg"
              className={GOLD_BUTTON}
              disabled={busy}
              onClick={() => props.onInvite(holder)}
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

/**
 * Màn "Người tin cậy" theo thiết kế: một Người thực hiện do Chủ kho mời; Người xét duyệt do hệ thống phân công.
 * Mọi thao tác (mời, mời thay, gửi lại, thu hồi) do Chủ kho chủ động; kết quả và điều kiện do Backend quyết định.
 * Phần giải thích vai trò nằm ở trang hướng dẫn, link tới đó đặt trong thẻ "Hướng dẫn cho Executor".
 * Cố ý không hiện đoạn phạm vi Executor (`executorScopeText`) và thẻ hoạt động gần đây để màn gọn.
 */
export function ExecutorsSection({
  vaultId,
  beneficiaries: _beneficiaries = [],
}: {
  vaultId: string;
  beneficiaries?: Beneficiary[];
}) {
  const query = usePlanSetup(vaultId);
  const client = useQueryClient();
  const resendAction = usePrivateAction();
  /** Lời mời vừa gửi lại thành công (BE xác nhận), để báo cho Owner; null khi chưa gửi hoặc đang gửi lần khác. */
  const [resent, setResent] = useState<Executor | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [invitationNotice, setInvitationNotice] = useState<{
    email: string;
    accountExists: boolean;
  } | null>(null);

  function sync(): void {
    void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
  }

  function resend(executor: Executor): void {
    setResent(null);
    void resendAction.execute(
      () => planSetupService.resend(vaultId, executor.id, executor.etag),
      (result) => {
        setResent(result);
        sync();
      },
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
  const primary = currentHolder(setup.executors);
  const replacement = pendingReplacement(setup.executors, primary);
  let banner: ReactNode = null;
  if (!manageable) {
    let reason = "Kế hoạch đang bị khóa";
    if (Object.hasOwn(LOCKED_REASONS, setup.planStatus)) {
      reason = LOCKED_REASONS[setup.planStatus];
    }
    banner = `${reason} nên bạn chưa thể mời, gửi lại hay thu hồi người thực hiện. Bạn chỉ xem được.`;
  } else if (planRunning) {
    banner =
      "Kế hoạch đang hoạt động. Bạn vẫn mời, gửi lại và thu hồi được. Người thực hiện đã nhận nhiệm vụ không thu hồi trực tiếp: hãy mời người thay, người cũ giữ vai trò tới khi người mới chấp nhận.";
  }
  const busy = resendAction.pending;

  return (
    <div className="space-y-6">
      {invitationNotice && (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm font-medium ${invitationNotice.accountExists ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}
        >
          <p>
            {invitationNotice.accountExists
              ? "Người dùng này đã có tài khoản trên hệ thống. Lời mời tham gia kho sẽ được gửi trực tiếp đến tài khoản của họ."
              : "Email này chưa đăng ký tài khoản. Hệ thống sẽ gửi email kèm liên kết mời kích hoạt và đăng ký mới."}
          </p>
          <button
            type="button"
            onClick={() => setInvitationNotice(null)}
            className="text-inherit opacity-70 hover:opacity-100"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      {banner !== null && (
        <p
          role="status"
          className="rounded-xl bg-heritage-warning-bg px-4 py-3 text-sm text-heritage-warning"
        >
          {banner}
        </p>
      )}
      <RoleCard
        title="Người thực hiện"
        holder={primary}
        pending={replacement}
        manageable={manageable}
        planRunning={planRunning}
        scopeVersion={setup.executorScopeVersion}
        busy={busy}
        onInvite={(replacing) => setDialog({ kind: "invite", replacing })}
        onRevoke={(executor) => setDialog({ kind: "revoke", executor })}
        onResend={resend}
      />
      {resendAction.pending && <p role="status">Đang gửi lại lời mời…</p>}
      {resent && !resendAction.pending && resent.invitationSentAt && (
        <p
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
          Đã gửi lại lời mời tới {resent.inviteeEmail}. Lời mời còn hiệu lực đến ngày{" "}
          {formatDate(resent.expiresAt)}.
        </p>
      )}
      {resent && !resendAction.pending && !resent.invitationSentAt && (
        <p
          role="status"
          className="rounded-xl bg-heritage-warning-bg px-4 py-3 text-sm text-heritage-warning"
        >
          Đã tạo lời mời mới cho {resent.inviteeEmail} nhưng chưa gửi được email. Kiểm tra cấu hình
          gửi thư rồi bấm Gửi lại lời mời.
        </p>
      )}
      {resendAction.error && (
        <div role="alert" className="space-y-3 text-destructive">
          <p>{resendAction.error}</p>
          <Button size="lg" variant="outline" onClick={sync}>
            Tải lại điều kiện
          </Button>
        </div>
      )}
      {dialog !== null && dialog.kind === "invite" && (
        <InviteDialog
          vaultId={vaultId}
          replacing={dialog.replacing}
          existingExecutors={setup.executors}
          sync={sync}
          onSuccess={(result) =>
            setInvitationNotice({
              email: result.inviteeEmail,
              accountExists: Boolean(result.accountExists),
            })
          }
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
