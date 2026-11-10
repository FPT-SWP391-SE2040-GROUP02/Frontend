import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, ChevronDown, X } from "lucide-react";
import { z } from "zod";
import { formatDate } from "@/shared/lib/dateFormat";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/heritageKit";
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
import { usePolicyWindows } from "@/shared/settings/usePolicyWindows";

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
const LOCKED_PLAN_STATUSES = ["DEATH_CASE_OPEN", "HANDOVER_IN_PROGRESS", "BLOCKED", "CLOSED"];
const RUNNING_PLAN_STATUSES = ["ACTIVE", "CHECKIN_OVERDUE", "AWAITING_CHECK"];

/** Lý do khóa ở đầu câu thông báo chỉ xem (thiết kế 186). */
const LOCKED_REASONS: Record<string, string> = {
  DEATH_CASE_OPEN: "Kế hoạch đang có hồ sơ báo tử",
  HANDOVER_IN_PROGRESS: "Kế hoạch đang bàn giao",
  BLOCKED: "Kế hoạch đang bị chặn",
  CLOSED: "Kế hoạch đã đóng",
};

/** Thông báo sau khi mời tự ẩn sau 8 giây. */
const NOTICE_HIDE_MS = 8000;

const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6";
const GOLD_BUTTON = "bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]";
const DANGER_BUTTON = "border-red-300 text-red-700 hover:bg-red-50";
const ALLOWED_ACTIONS = [
  "Điểm danh thay khi bạn quá hạn",
  "Báo tin và nộp giấy chứng tử",
  "Trao mã mở gói cho người nhận",
];

function isLive(executor: Executor): boolean {
  return (
    executor.status === "INVITED" ||
    executor.status === "ACCEPTED" ||
    executor.status === "SUSPENDED"
  );
}

/** Người đang giữ vai: ưu tiên người đã đồng ý (người thay đang chờ không thay họ cho tới khi đồng ý). */
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
}: {
  title: string;
  items: string[];
  allowed: boolean;
}) {
  let titleColor = "text-red-700";
  let mark: ReactNode = <X className="mt-0.5 size-4 shrink-0 text-red-700" aria-hidden="true" />;
  if (allowed) {
    titleColor = "text-green-700";
    mark = <Check className="mt-0.5 size-4 shrink-0 text-green-700" aria-hidden="true" />;
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
      <p className={`text-xs font-semibold ${titleColor}`}>{title}</p>
      <ul className="mt-2 space-y-2">{rows}</ul>
    </div>
  );
}

interface InviteDialogProps {
  vaultId: string;
  replacing: Executor | null;
  existingExecutors: Executor[];
  /** Kho đã có mã mở gói: khi thay người, nhắc Chủ kho đổi mã mới sau khi người mới đồng ý. */
  hasHandoverKey: boolean;
  sync: () => void;
  onSuccess?: (result: Executor) => void;
  onClose: () => void;
}

function InviteDialog({
  vaultId,
  replacing,
  existingExecutors,
  hasHandoverKey,
  sync,
  onSuccess,
  onClose,
}: InviteDialogProps) {
  const { executorInviteDays } = usePolicyWindows();
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
            message: "Bạn không thể tự mời chính mình làm Người thực thi.",
          });
          return;
        }
        if (replacing && email === replacing.inviteeEmail.trim().toLowerCase()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["email"],
            message: "Người thay thế phải có email khác với Người thực thi hiện tại.",
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
            message: "Email này đã được mời hoặc đang là Người thực thi.",
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
  let title = "Mời Người thực thi";
  let description =
    "Người này sẽ báo tin khi có biến cố và trao mã mở gói cho người nhận. Họ không đọc được nội dung kho và không nhận tài sản.";
  let notice = `Lời mời có hiệu lực ${executorInviteDays} ngày.`;
  let cancelLabel = "Hủy";
  if (replacing !== null) {
    title = "Mời người thay";
    description = `Người mới sẽ là Người thực thi khi đồng ý lời mời; lúc đó ${replacing.inviteeEmail} tự động thành “Đã thu hồi”. Trong lúc chờ, người cũ vẫn giữ quyền.`;
    if (hasHandoverKey) {
      description = `${description} Mã mở gói hiện tại vẫn nằm trong tay người cũ, nên sau khi người mới đồng ý bạn nên đổi mã mới.`;
    }
    notice = `Lời mời có hiệu lực ${executorInviteDays} ngày. Hết hạn mà chưa đồng ý thì ${replacing.inviteeEmail} vẫn là Người thực thi.`;
    cancelLabel = "Giữ nguyên";
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
              Email
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
              {cancelLabel}
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
          <DialogTitle>Thu hồi lời mời?</DialogTitle>
          <DialogDescription>
            {executor.inviteeEmail} sẽ không còn là Người thực thi của kho này.
          </DialogDescription>
        </DialogHeader>
        <p className="rounded-lg bg-[#F1E7D0] p-3 text-sm text-[#7A5B24]">
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
            Giữ nguyên
          </Button>
          <Button
            size="lg"
            type="button"
            variant="outline"
            className={DANGER_BUTTON}
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
            Thu hồi lời mời
          </Button>
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
      <p className="text-xs text-heritage-muted">Mỗi kho một người · bắt buộc để kích hoạt</p>
    </div>
  );

  if (holder === null) {
    return (
      <section aria-label="Người bạn chọn" className={CARD}>
        {header}
        <div className="mt-4 rounded-xl border-2 border-dashed border-heritage-border p-5">
          <p className="font-semibold">Bạn chưa mời ai</p>
          <p className="mt-2 text-sm leading-6 text-heritage-muted">
            Chọn người bạn tin, thường là người thân hoặc luật sư gia đình. Họ cần có email và sẽ
            phải đồng ý trước khi kế hoạch được kích hoạt.
          </p>
          {manageable && (
            <Button
              size="lg"
              className={`${GOLD_BUTTON} mt-4`}
              disabled={busy}
              onClick={() => props.onInvite(null)}
            >
              Mời Người thực thi
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
    statusText = "Người này đang giữ phiếu mã mở gói.";
  } else {
    statusText = "Người này sẽ giữ phiếu mã mở gói sau khi bạn kích hoạt kế hoạch.";
  }

  const forbidden: string[] = ["Đọc nội dung kho", "Tự duyệt hồ sơ"];
  if (!holder.isBeneficiary) {
    forbidden.push("Nhận tài sản trong kho này");
  }

  return (
    <section aria-label="Người bạn chọn" className={CARD}>
      {header}
      <div className="mt-4 rounded-xl border border-heritage-border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E0C486] font-semibold text-[#0A281E]"
              aria-hidden="true"
            >
              {holder.inviteeEmail.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="break-all font-semibold">{holder.inviteeEmail}</p>
              <p className="text-xs text-heritage-muted">Người thực thi của kho</p>
            </div>
          </div>
          <Chip tone={statusTones[holder.status]}>{statusLabels[holder.status]}</Chip>
        </div>
        {dateLine !== "" && <p className="mt-3 text-xs text-heritage-muted">{dateLine}</p>}

        <p className="mt-3 text-sm leading-6">{statusText}</p>
        {holder.isBeneficiary && (
          <p className="mt-2 text-sm leading-6">Người này cũng là người nhận trong kho này.</p>
        )}
        {holder.status === "INVITED" && !holder.invitationSentAt && (
          <p role="status" className="mt-3 text-sm text-amber-800">
            Chưa xác nhận gửi được email mời tới người này, nên họ có thể chưa nhận được thư. Hãy
            bấm Gửi lại lời mời.
          </p>
        )}
        {pending !== null && (
          <p className="mt-3 rounded-lg bg-[#F1E7D0] p-3 text-sm text-[#7A5B24]">
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
                className={DANGER_BUTTON}
                disabled={busy}
                onClick={() => props.onRevoke(holder)}
              >
                Thu hồi lời mời
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
        Hệ thống tự phân công khi có báo tin, bạn không cần chọn. Người xét duyệt khác Người thực
        thi, nên không ai một mình vừa báo tin vừa duyệt được.
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
        <p className="text-xs text-heritage-muted">{formatDate(event.at)}</p>
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

  let tone = "border-amber-200 bg-amber-50 text-amber-800";
  let message: ReactNode = (
    <>
      Đã gửi lời mời tới <strong>{notice.email}</strong>. Người này chưa có tài khoản. Họ cần mở
      email mời và tạo tài khoản bằng đúng email này để đồng ý.
    </>
  );
  if (notice.accountExists) {
    tone = "border-green-200 bg-green-50 text-green-800";
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
  /** Thẻ "Mã mở gói" đặt đầu cột phải; widget ghép vì feature này không được import feature khác. */
  keySlot?: ReactNode;
  /** Thẻ "Lời dặn cho Người thực thi" đặt dưới thẻ "Người bạn chọn" ở cột trái. */
  noteSlot?: ReactNode;
  /** Kho đã có mã mở gói (dùng để nhắc đổi mã khi thay người). */
  hasHandoverKey?: boolean;
}

/**
 * Trang "Người thực thi": mỗi kho một người do Chủ kho mời; Người xét duyệt do hệ thống phân công.
 * Mọi thao tác (mời, thay người, gửi lại, thu hồi) do Chủ kho chủ động; kết quả và điều kiện do Backend quyết định.
 */
export function ExecutorsSection({
  vaultId,
  keySlot,
  noteSlot,
  hasHandoverKey = false,
}: ExecutorsSectionProps) {
  const query = usePlanSetup(vaultId);
  const client = useQueryClient();
  const resendAction = usePrivateAction();
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
      () => planSetupService.resend(vaultId, executor.id, executor.etag),
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
        <p role="status" className="rounded-xl bg-[#F1E7D0] px-4 py-3 text-sm text-[#7A5B24]">
          {banner}
        </p>
      )}
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
        <p role="status" className="rounded-xl bg-[#F1E7D0] px-4 py-3 text-sm text-[#7A5B24]">
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

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-6">
          <ChosenCard
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
          {noteSlot}
        </div>
        <div className="min-w-0 space-y-6">
          {keySlot}
          <ReviewerCard />
          <RecentActivity executors={setup.executors} />
        </div>
      </div>

      {dialog !== null && dialog.kind === "invite" && (
        <InviteDialog
          vaultId={vaultId}
          replacing={dialog.replacing}
          existingExecutors={setup.executors}
          hasHandoverKey={hasHandoverKey}
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
          vaultId={vaultId}
          executor={dialog.executor}
          sync={sync}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
