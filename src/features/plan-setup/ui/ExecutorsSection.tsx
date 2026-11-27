import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, ChevronDown, X } from "lucide-react";
import { z } from "zod";
import { SUPPORT_EMAIL } from "@/shared/constants";
import { formatDate } from "@/shared/lib/dateFormat";
import { ROUTES } from "@/shared/config/routes.config";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/heritageKit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import type { AuthState } from "@/entities/user/model/authSlice";
import { SystemExecutorDirectory, type SystemExecutor } from "@/entities/executor";
import { inviteExecutorSchema, type executorSchema } from "../model/planSetup.schema";
import { planSetupService } from "../api/planSetupService";
import { usePlanSetup } from "../model/usePlanSetup";
import { currentHolder } from "../lib/executorHolder";
import { usePolicyWindows } from "@/shared/settings/usePolicyWindows";
import { ActionButton } from "@/shared/ui/ActionButton";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";

type Executor = z.infer<typeof executorSchema>;

/** Hộp thoại đang mở: mời, mời người thay, hoặc thu hồi. */
type DialogState =
  { kind: "invite"; replacing: Executor | null } | { kind: "revoke"; executor: Executor } | null;

type ChipTone = "success" | "warning" | "neutral" | "danger";

const statusLabels: Record<Executor["status"], string> = {
  INVITED: "Chờ đồng ý",
  ACCEPTED: "Đã đồng ý",
  DECLINED: "Đã từ chối",
  EXPIRED: "Hết hạn",
  REVOKED: "Đã thu hồi",
  SUSPENDED: "Cần đồng ý lại",
};

const statusTones: Record<Executor["status"], ChipTone> = {
  INVITED: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
  EXPIRED: "neutral",
  REVOKED: "neutral",
  SUSPENDED: "warning",
};

/** Kế hoạch ở các trạng thái này thì Backend chặn mời, gửi lại và thu hồi Người thực thi (SETUP-21). */
const LOCKED_PLAN_STATUSES = ["HANDOVER_REQUESTED", "HANDOVER_IN_PROGRESS", "CLOSED"];
const RUNNING_PLAN_STATUSES = ["ACTIVE"];

/** Lý do khóa ở đầu câu thông báo chỉ xem (thiết kế 186). */
const LOCKED_REASONS: Record<string, string> = {
  HANDOVER_REQUESTED: "Có người nhận gửi yêu cầu nhận tài sản",
  HANDOVER_IN_PROGRESS: "Kế hoạch đang bàn giao",
  CLOSED: "Kế hoạch đã đóng",
};

/** Thông báo sau khi mời tự ẩn sau 8 giây. */
const NOTICE_HIDE_MS = 8000;

const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6";
const PRIMARY_BUTTON =
  "bg-heritage-primary font-semibold text-white shadow-none hover:bg-heritage-primary-hover";
const DANGER_BUTTON =
  "border-heritage-danger-border text-heritage-danger hover:bg-heritage-danger-bg";
const ALLOWED_ACTIONS = [
  "Giữ mã nhận cho tới khi bàn giao",
  "Ký biên bản bàn giao do luật sư lập",
  "Trao mã nhận cho người nhận",
];

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
}: {
  title: string;
  items: string[];
  allowed: boolean;
}) {
  let titleColor = "text-heritage-danger";
  let mark: ReactNode = (
    <X className="mt-0.5 size-4 shrink-0 text-heritage-danger" aria-hidden="true" />
  );
  if (allowed) {
    titleColor = "text-heritage-success";
    mark = <Check className="mt-0.5 size-4 shrink-0 text-heritage-success" aria-hidden="true" />;
  }
  const rows: ReactNode[] = [];
  for (const item of items) {
    rows.push(
      <li key={item} className="flex items-start gap-2 text-sm">
        {mark}
        {item}
      </li>,
    );
  }
  return (
    <div>
      <p className={`text-sm font-semibold ${titleColor}`}>{title}</p>
      <ul className="mt-2 space-y-2">{rows}</ul>
    </div>
  );
}

export interface InviteDialogProps {
  vaultId: string;
  replacing: Executor | null;
  existingExecutors: Executor[];
  sync: () => void;
  onSuccess?: (result: Executor) => void;
  onClose: () => void;
}

/** Hộp thoại chọn và mời Người thực thi; dùng chung cho trang Người thực thi và thẻ việc ở trang Bàn giao. */
export function InviteDialog({
  vaultId,
  replacing,
  existingExecutors,
  sync,
  onSuccess,
  onClose,
}: InviteDialogProps) {
  const { executorInviteMinutes } = usePolicyWindows();
  const action = usePrivateAction();
  const success = useSuccessHold();
  const ownerEmail = useSelector((state: { auth: AuthState }) => state.auth.user?.email);

  const form = useForm<z.infer<typeof inviteExecutorSchema>>({
    resolver: zodResolver(inviteExecutorSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { email: "" },
  });
  const selectedEmail = useWatch({ control: form.control, name: "email" });
  // Điều khoản về vai trò Người thực thi: Chủ tài sản phải đồng ý trước khi gửi lời mời (nhân viên LegacyVault chỉ giữ hộ và giao tài sản theo biên bản của luật sư).
  const [nominationAccepted, setNominationAccepted] = useState(false);

  /** Lý do không chọn được một người trong danh bạ (Backend vẫn là nơi quyết định cuối cùng). */
  function disabledReason(executor: SystemExecutor): string | null {
    const email = executor.email.trim().toLowerCase();
    if (ownerEmail && email === ownerEmail.trim().toLowerCase()) {
      return "Đây là tài khoản của bạn.";
    }
    if (replacing && email === replacing.inviteeEmail.trim().toLowerCase()) {
      return "Người này đang là Người thực thi hiện tại.";
    }
    const taken = existingExecutors.some(
      (e) =>
        e.inviteeEmail.trim().toLowerCase() === email &&
        (e.status === "INVITED" || e.status === "ACCEPTED" || e.status === "SUSPENDED") &&
        (!replacing || e.id !== replacing.id),
    );
    if (taken) {
      return "Người này đã được mời hoặc đang là Người thực thi.";
    }
    return null;
  }

  let title = "Chọn Người thực thi của bạn";
  let description =
    "Chọn một Người thực thi hệ thống đã được thẩm định. Người này giữ hộ tài sản, ký biên bản và gửi mã nhận khi bàn giao; không đọc được nội dung tài sản.";
  let notice = `Lời mời có hiệu lực ${executorInviteMinutes} phút.`;
  let cancelLabel = "Hủy";
  if (replacing !== null) {
    title = "Mời người thay";
    description = `Người mới sẽ là Người thực thi khi đồng ý lời mời; lúc đó ${replacing.inviteeEmail} tự động thành “Đã thu hồi”. Trong lúc chờ, người cũ vẫn giữ quyền.`;
    description = `${description} Khi người mới đồng ý, hệ thống tự đổi mã nhận để người cũ không còn dùng được mã cũ.`;
    notice = `Lời mời có hiệu lực ${executorInviteMinutes} phút. Hết hạn mà chưa đồng ý thì ${replacing.inviteeEmail} vẫn là Người thực thi.`;
    cancelLabel = "Giữ nguyên";
  }
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            const done = await action.execute(
              () => success.hold(() => planSetupService.invite(vaultId, values)),
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
            <legend className="text-sm font-semibold">Danh sách người thực thi hệ thống</legend>
            <input type="hidden" {...form.register("email")} />
            <SystemExecutorDirectory
              selectedEmail={selectedEmail === "" ? null : selectedEmail}
              getDisabledReason={disabledReason}
              onSelect={(executor) =>
                form.setValue("email", executor.email, { shouldValidate: true, shouldDirty: true })
              }
            />
            {form.formState.errors.email && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </fieldset>
          <p className="rounded-lg bg-heritage-warning-bg p-3 text-sm text-heritage-warning">
            {notice}
          </p>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-heritage-primary"
              checked={nominationAccepted}
              disabled={action.pending}
              onChange={(event) => setNominationAccepted(event.target.checked)}
            />
            <span>
              Tôi hiểu Người thực thi là nhân viên LegacyVault, chỉ giữ hộ và giao tài sản theo biên
              bản bàn giao do luật sư lập; không có quyền xem nội dung, chia, bán hay cho tài sản.
            </span>
          </label>
          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
          <DialogFooter className="sticky -bottom-4 -mx-4 -mb-4 border-t border-heritage-border bg-popover px-4 py-3">
            <Button
              size="lg"
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={action.pending}
            >
              {cancelLabel}
            </Button>
            <ActionButton
              type="submit"
              className={buttonVariants({ size: "lg", className: PRIMARY_BUTTON })}
              disabled={action.pending || selectedEmail === "" || !nominationAccepted}
              pending={action.pending}
              done={success.done}
              pendingLabel="Đang gửi…"
              doneLabel="Đã gửi"
            >
              Gửi lời mời
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Chữ trong hộp thu hồi, khác nhau theo việc người đó đã đồng ý hay chưa và nơi mở hộp. */
function revokeCopy(accepted: boolean, changing: boolean) {
  if (changing) {
    return { title: "Đổi Người thực thi?", confirm: "Thu hồi để đổi người" };
  }
  if (accepted) {
    return { title: "Thu hồi vai Người thực thi?", confirm: "Thu hồi vai" };
  }
  return { title: "Thu hồi lời mời?", confirm: "Thu hồi lời mời" };
}

/** Hộp thoại thu hồi lời mời hoặc vai; dùng chung cho trang Người thực thi và thẻ việc ở trang Bàn giao. */
export function RevokeDialog({
  vaultId,
  executor,
  changing = false,
  planRunning = false,
  sync,
  onClose,
}: {
  vaultId: string;
  executor: Executor;
  /** Mở từ nút "Đổi người": thu hồi xong sẽ chọn người mới. */
  changing?: boolean;
  /** Kế hoạch đã chạy thì không còn nói về điều kiện kích hoạt. */
  planRunning?: boolean;
  sync: () => void;
  onClose: () => void;
}) {
  const action = usePrivateAction();
  const success = useSuccessHold();
  const accepted = executor.status === "ACCEPTED";
  const copy = revokeCopy(accepted, changing);

  const facts: string[] = [statusLabels[executor.status]];
  if (accepted && executor.acceptedAt !== null) {
    facts[0] = `${facts[0]} ngày ${formatDate(executor.acceptedAt)}`;
  } else if (executor.invitationSentAt !== null) {
    facts.push(`mời ngày ${formatDate(executor.invitationSentAt)}`);
  }

  const consequences: string[] = [];
  if (accepted) {
    consequences.push("Người này sẽ không còn là Người thực thi của tài sản.");
  } else {
    consequences.push("Liên kết trong email mời sẽ không dùng được nữa.");
  }
  if (changing) {
    consequences.push("Thu hồi xong, bạn chọn người mới ngay ở thẻ này.");
  } else {
    consequences.push("Bạn có thể mời lại người này hoặc người khác.");
  }
  if (planRunning) {
    consequences.push("Kế hoạch đang hoạt động, hãy sớm mời người mới.");
  } else {
    consequences.push("Kế hoạch cần có Người thực thi mới kích hoạt được.");
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>
        <div className="rounded-xl border border-heritage-border px-4 py-3">
          {executor.fullName && <p className="break-words font-semibold">{executor.fullName}</p>}
          <p className="break-all text-sm">{executor.inviteeEmail}</p>
          <p className="mt-1 text-sm text-heritage-muted">{facts.join(" · ")}</p>
        </div>
        <DialogDescription render={<ul className="list-disc space-y-1.5 pl-5 leading-6" />}>
          {consequences.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </DialogDescription>
        {action.error && (
          <p
            role="alert"
            className="rounded-lg bg-heritage-danger-bg p-3 text-sm text-heritage-danger"
          >
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
            Giữ nguyên
          </Button>
          <ActionButton
            className={buttonVariants({
              size: "lg",
              variant: "outline",
              className: DANGER_BUTTON,
            })}
            disabled={action.pending}
            pending={action.pending}
            done={success.done}
            pendingLabel="Đang thu hồi…"
            doneLabel="Đã thu hồi"
            onClick={() =>
              void action.execute(
                () =>
                  success.hold(() => planSetupService.revoke(vaultId, executor.id, executor.etag)),
                () => {
                  sync();
                  onClose();
                },
              )
            }
          >
            {copy.confirm}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ChosenCardProps {
  holder: Executor | null;
  pending: Executor | null;
  manageable: boolean;
  planRunning: boolean;
  scopeVersion: string;
  busy: boolean;
  /** Đang gửi lại lời mời, và server đã báo gửi xong (giữ dấu tích một nhịp). */
  resending: boolean;
  resendDone: boolean;
  onInvite: (replacing: Executor | null) => void;
  onRevoke: (executor: Executor) => void;
  onResend: (executor: Executor) => void;
}

/** Thẻ "Người bạn chọn": chưa mời ai thì khung mời, đã mời thì trạng thái và các nút theo luật thay người. */
function ChosenCard(props: ChosenCardProps) {
  const { holder, pending, manageable, planRunning, scopeVersion, busy } = props;
  const header = (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-xl font-medium text-heritage-primary">Người bạn chọn</h2>
      <p className="text-sm text-heritage-muted">Mỗi tài sản một người · bắt buộc để kích hoạt</p>
    </div>
  );

  if (holder === null) {
    return (
      <section aria-label="Người bạn chọn" className={CARD}>
        {header}
        <div className="mt-4 rounded-xl border-2 border-dashed border-heritage-border p-5">
          <p className="font-semibold">Bạn chưa mời ai</p>
          <p className="mt-2 text-sm leading-6 text-heritage-muted">
            Chọn một Người thực thi hệ thống trong danh bạ: luật sư, chuyên viên đã được thẩm định
            pháp lý. Họ sẽ phải đồng ý trước khi kế hoạch được kích hoạt.
          </p>
          {manageable && (
            <Button
              size="lg"
              className={`${PRIMARY_BUTTON} mt-4`}
              disabled={busy}
              onClick={() => props.onInvite(null)}
            >
              Chọn Người thực thi
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </section>
    );
  }

  const invitedOn = holder.invitationSentAt;
  let dateLine = "";
  if (holder.acceptedAt !== null) {
    dateLine = `Đồng ý ngày ${formatDate(holder.acceptedAt)}`;
    if (invitedOn !== null) {
      dateLine = `Mời ngày ${formatDate(invitedOn)} · ${dateLine}`;
    }
  } else if (invitedOn !== null) {
    dateLine = `Mời ngày ${formatDate(invitedOn)}`;
  }

  const needsResend =
    holder.status === "INVITED" ||
    holder.status === "SUSPENDED" ||
    (holder.status === "ACCEPTED" && holder.acceptedScopeVersion !== scopeVersion);
  // Người thực thi đã nhận nhiệm vụ khi kế hoạch chạy: Backend yêu cầu mời người thay, không thu hồi trực tiếp.
  const mustReplace = holder.status === "ACCEPTED" && planRunning;
  let revokeLabel = "Thu hồi lời mời";
  if (holder.status === "ACCEPTED") {
    revokeLabel = "Thu hồi vai";
  }

  let statusText: ReactNode;
  if (holder.status === "INVITED") {
    statusText = (
      <>
        Đang chờ người này đồng ý. Lời mời còn hiệu lực đến{" "}
        <strong>{formatDate(holder.expiresAt)}</strong>. Nếu họ chưa thấy, hãy nhắc họ xem email
        hoặc bấm Gửi lại lời mời.
      </>
    );
  } else if (holder.status === "SUSPENDED") {
    statusText = "Người này cần đồng ý lại. Bấm Gửi lại lời mời để họ xác nhận.";
  } else if (planRunning) {
    statusText =
      "Hệ thống tự giữ mã nhận. Người này chỉ xem được sau khi luật sư chốt phương án chia.";
  } else {
    statusText =
      "Hệ thống tạo mã nhận khi bạn ký và kích hoạt kế hoạch. Người này chỉ xem được sau khi luật sư chốt phương án chia.";
  }

  const forbidden: string[] = ["Đọc nội dung tài sản", "Tự duyệt hồ sơ", "Nhận tài sản này"];

  return (
    <section aria-label="Người bạn chọn" className={CARD}>
      {header}
      <div className="mt-4 rounded-xl border border-heritage-border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-heritage-gold-soft font-semibold text-heritage-primary"
              aria-hidden="true"
            >
              {holder.inviteeEmail.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="break-all font-semibold">{holder.inviteeEmail}</p>
              <p className="text-sm text-heritage-muted">Người thực thi của tài sản</p>
            </div>
          </div>
          <Chip tone={statusTones[holder.status]}>{statusLabels[holder.status]}</Chip>
        </div>
        {dateLine !== "" && <p className="mt-3 text-sm text-heritage-muted">{dateLine}</p>}

        <p className="mt-3 text-sm leading-6">{statusText}</p>
        {holder.emailUndeliverable && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            Máy chủ thư báo không gửi được thư tới email này. Có thể email không tồn tại, hãy liên
            hệ ban quản trị qua {SUPPORT_EMAIL} để kiểm tra lại.
          </p>
        )}
        {holder.status === "INVITED" && !holder.invitationSentAt && (
          <p role="status" className="mt-3 text-sm text-heritage-warning">
            Chưa xác nhận gửi được email mời tới người này, nên họ có thể chưa nhận được thư. Hãy
            bấm Gửi lại lời mời.
          </p>
        )}
        {pending !== null && (
          <p className="mt-3 rounded-lg bg-heritage-warning-bg p-3 text-sm text-heritage-warning">
            Đã mời người thay: {pending.inviteeEmail} · {statusLabels[pending.status]}. Người hiện
            tại vẫn giữ quyền đến khi người mới đồng ý.
          </p>
        )}

        {manageable && (
          <div className="mt-4 flex flex-wrap gap-3">
            {holder.status === "ACCEPTED" && (
              <Button
                size="lg"
                variant="outline"
                disabled={busy}
                onClick={() => props.onInvite(holder)}
              >
                Thay người khác
              </Button>
            )}
            {needsResend && (
              <ActionButton
                className={buttonVariants({ size: "lg", variant: "outline" })}
                disabled={busy}
                pending={props.resending}
                done={props.resendDone}
                pendingLabel="Đang gửi…"
                doneLabel="Đã gửi"
                onClick={() => props.onResend(holder)}
              >
                Gửi lại lời mời
              </ActionButton>
            )}
            {!mustReplace && (
              <Button
                size="lg"
                variant="outline"
                className={DANGER_BUTTON}
                disabled={busy}
                onClick={() => props.onRevoke(holder)}
              >
                {revokeLabel}
              </Button>
            )}
          </div>
        )}

        {/* owner-workspace.css cho mọi <details> viền, nền và bóng kiểu thẻ; ở đây chỉ cần một đường kẻ trên nên tắt bằng "!". */}
        <details className="group mt-5 rounded-none! border-x-0! border-b-0! border-t border-heritage-border bg-transparent! pt-4 shadow-none!">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-heritage-primary">
            Người thực thi được làm gì?
            <ChevronDown
              className="size-4 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <ActionList title="Được làm" items={ALLOWED_ACTIONS} allowed />
            <ActionList title="Không được làm" items={forbidden} allowed={false} />
          </div>
        </details>
      </div>
    </section>
  );
}

/** Thẻ giải thích người xét duyệt do hệ thống phân công; hiện ở mọi trạng thái kế hoạch. */
function ReviewerCard() {
  return (
    <section aria-label="Người xét duyệt" className={CARD}>
      <h2 className="text-xl font-medium text-heritage-primary">Người xét duyệt</h2>
      <p className="mt-3 text-sm leading-6 text-heritage-muted">
        Hệ thống tự phân công luật sư khi người nhận gửi yêu cầu nhận tài sản, bạn không cần chọn.
        Luật sư lập phương án chia; Người thực thi chỉ giữ hộ và giao theo biên bản.
      </p>
    </section>
  );
}

function RecentActivity({ executors }: { executors: Executor[] }) {
  const events: { key: string; text: string; at: string }[] = [];
  for (const executor of executors) {
    if (executor.acceptedAt !== null) {
      events.push({
        key: `${executor.id}-accepted`,
        text: `${executor.inviteeEmail} đồng ý lời mời`,
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
        <p className="text-sm text-heritage-muted">{formatDate(event.at)}</p>
      </li>,
    );
  }
  return (
    <section aria-label="Hoạt động gần đây" className={CARD}>
      <h2 className="text-xl font-medium text-heritage-primary">Hoạt động gần đây</h2>
      {rows.length === 0 && <p className="mt-4 text-sm text-heritage-muted">Chưa có hoạt động.</p>}
      <ul className="mt-2">{rows}</ul>
      <Link
        to={ROUTES.DASHBOARD.AUDIT_LOG}
        className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-heritage-primary underline underline-offset-4"
      >
        Xem nhật ký đầy đủ
      </Link>
    </section>
  );
}

interface InvitationNoticeData {
  id: number;
  email: string;
  accountExists: boolean;
}

/** Thông báo sau khi mời: hai câu khác nhau theo việc người được mời đã có tài khoản hay chưa; tự ẩn sau 8 giây. */
function InvitationNotice({
  notice,
  onClose,
}: {
  notice: InvitationNoticeData;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, NOTICE_HIDE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [notice.id, onClose]);

  let tone = "border-heritage-warning-border bg-heritage-warning-bg text-heritage-warning";
  let message: ReactNode = (
    <>
      Đã gửi lời mời tới <strong>{notice.email}</strong>. Người này chưa có tài khoản. Họ cần mở
      email mời và tạo tài khoản bằng đúng email này để đồng ý.
    </>
  );
  if (notice.accountExists) {
    tone = "border-heritage-success-border bg-heritage-success-bg text-heritage-success";
    message = (
      <>
        Đã gửi lời mời tới <strong>{notice.email}</strong>. Người này đã có tài khoản LegacyVault,
        lời mời hiện ngay trong mục Lời mời khi họ đăng nhập.
      </>
    );
  }
  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm font-medium ${tone}`}
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 text-inherit opacity-70 hover:opacity-100"
        aria-label="Đóng thông báo"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export interface ExecutorsSectionProps {
  vaultId: string;
  /** Thẻ "Lời dặn cho Người thực thi" đặt dưới thẻ "Người bạn chọn", ở cột trái. */
  noteSlot?: ReactNode;
}

/**
 * Trang "Người thực thi": mỗi kho một người do Chủ tài sản mời; Người xét duyệt do hệ thống phân công.
 * Mọi thao tác (mời, thay người, gửi lại, thu hồi) do Chủ tài sản chủ động; kết quả và điều kiện do Backend quyết định.
 */
export function ExecutorsSection({ vaultId, noteSlot }: ExecutorsSectionProps) {
  const query = usePlanSetup(vaultId);
  const client = useQueryClient();
  const resendAction = usePrivateAction();
  const resendSuccess = useSuccessHold();
  /** Lời mời vừa gửi lại thành công (BE xác nhận), để báo cho Owner; null khi chưa gửi hoặc đang gửi lần khác. */
  const [resent, setResent] = useState<Executor | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [invitationNotice, setInvitationNotice] = useState<InvitationNoticeData | null>(null);
  const closeNotice = useCallback(() => setInvitationNotice(null), []);

  function sync(): void {
    void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
  }

  function resend(executor: Executor): void {
    setResent(null);
    void resendAction.execute(
      () =>
        resendSuccess.hold(
          () => planSetupService.resend(vaultId, executor.id, executor.etag),
          // Chỉ hiện dấu tích khi thư thật sự gửi được.
          (result) => Boolean(result.invitationSentAt),
        ),
      (result) => {
        setResent(result);
        sync();
      },
    );
  }

  if (query.isPending) {
    return <p role="status">Đang tải Người thực thi…</p>;
  }
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không tải được thông tin Người thực thi.</p>
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
  let banner: string | null = null;
  if (!manageable) {
    let reason = "Kế hoạch đang bị khóa";
    if (Object.hasOwn(LOCKED_REASONS, setup.planStatus)) {
      reason = LOCKED_REASONS[setup.planStatus];
    }
    banner = `${reason} nên bạn chưa thể mời, gửi lại hay thu hồi Người thực thi. Bạn chỉ xem được.`;
  } else if (planRunning) {
    banner =
      "Kế hoạch đang hoạt động. Người thực thi đã đồng ý không thu hồi trực tiếp được: hãy bấm Thay người khác, người cũ giữ quyền tới khi người mới đồng ý.";
  }
  const busy = resendAction.pending;

  return (
    <div className="space-y-6">
      {invitationNotice !== null && (
        <InvitationNotice notice={invitationNotice} onClose={closeNotice} />
      )}
      {banner !== null && (
        <p
          role="status"
          className="rounded-xl bg-heritage-warning-bg px-4 py-3 text-sm text-heritage-warning"
        >
          {banner}
        </p>
      )}
      {resent && !resendAction.pending && resent.invitationSentAt && (
        <p
          role="status"
          className="rounded-xl border border-heritage-success-border bg-heritage-success-bg px-4 py-3 text-sm font-medium text-heritage-success"
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

      <ChosenCard
        holder={primary}
        pending={replacement}
        manageable={manageable}
        planRunning={planRunning}
        scopeVersion={setup.executorScopeVersion}
        busy={busy}
        resending={resendAction.pending}
        resendDone={resendSuccess.done}
        onInvite={(replacing) => setDialog({ kind: "invite", replacing })}
        onRevoke={(executor) => setDialog({ kind: "revoke", executor })}
        onResend={resend}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-6">{noteSlot}</div>
        <div className="min-w-0 space-y-6">
          <ReviewerCard />
          <RecentActivity executors={setup.executors} />
        </div>
      </div>

      {dialog !== null && dialog.kind === "invite" && (
        <InviteDialog
          vaultId={vaultId}
          replacing={dialog.replacing}
          existingExecutors={setup.executors}
          sync={sync}
          onSuccess={(result) =>
            setInvitationNotice({
              id: Date.now(),
              email: result.inviteeEmail,
              accountExists: Boolean(result.accountExists),
            })
          }
          onClose={() => setDialog(null)}
        />
      )}
      {dialog !== null && dialog.kind === "revoke" && (
        <RevokeDialog
          planRunning={planRunning}
          vaultId={vaultId}
          executor={dialog.executor}
          sync={sync}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
