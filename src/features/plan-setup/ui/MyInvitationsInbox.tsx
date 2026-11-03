import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CircleAlert } from "lucide-react";
import { buttonStyles, Chip, Initial, Notice, Panel } from "@/shared/ui/heritageKit";
import { Input } from "@/shared/ui/input";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { formatDate } from "@/shared/lib/dateFormat";
import { ROUTES } from "@/shared/config/routes.config";
import { planSetupService } from "../api/planSetupService";
import { myInvitationsKey, useMyInvitations } from "../model/useMyInvitations";
import type { MyInvitation } from "../model/myInvitations.schema";
import { endedStatusLabel, parseInvitationToken, remainingTime } from "../lib/myInvitationHelpers";

const CAPABILITIES = ["Báo tin cho hệ thống khi Chủ kho qua đời", "Theo dõi tiến trình bàn giao"];

/**
 * Trang Lời mời: lời mời đang chờ (chấp nhận/từ chối ngay, không cần link email), ô dán link cho lời mời gửi
 * tới email khác, và lời mời đã kết thúc. Quyết định chỉ gửi khi người dùng bấm; Backend kiểm tra email và phạm vi.
 * `showPasteLink`: chỉ bật ở không gian Người thực hiện; bên Chủ kho người mới chỉ cần bấm link trong email.
 */
export function MyInvitationsInbox({ showPasteLink = false }: { showPasteLink?: boolean }) {
  const invitations = useMyInvitations();
  const [acceptedOwner, setAcceptedOwner] = useState<string | null>(null);
  let pendingBody;
  if (invitations.isPending) {
    pendingBody = (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải lời mời…
      </p>
    );
  } else if (invitations.isError) {
    pendingBody = (
      <Notice
        tone="danger"
        role="alert"
        title="Không tải được lời mời"
        action={
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={invitations.isFetching}
            onClick={() => void invitations.refetch()}
          >
            Thử lại
          </button>
        }
      />
    );
  } else if (invitations.data.pending.length === 0) {
    pendingBody = (
      <p role="status" className="text-sm text-heritage-muted">
        Không có lời mời nào đang chờ bạn trả lời.
      </p>
    );
  } else {
    const data = invitations.data;
    pendingBody = (
      <ul className="space-y-4">
        {data.pending.map((invitation) => (
          <li key={invitation.id}>
            <PendingInvitationCard
              invitation={invitation}
              scopeVersion={data.scopeVersion}
              onAccepted={() => setAcceptedOwner(invitation.ownerName)}
            />
          </li>
        ))}
      </ul>
    );
  }
  let pendingCount = 0;
  if (invitations.isSuccess) pendingCount = invitations.data.pending.length;
  return (
    <div className="space-y-6">
      {acceptedOwner && (
        <Notice tone="success" role="status" title="Bạn đã là Người thực hiện">
          Cho kho của {acceptedOwner}. Nút Sang vai Người thực hiện đã hiện ở thanh bên.
        </Notice>
      )}
      <Panel title="Đang chờ bạn trả lời" labelledBy="pending-invitations-heading">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-heritage-muted">
            Người thực hiện báo tin khi Chủ kho qua đời.{" "}
            <strong className="text-heritage-primary">Không ai mở được kho</strong>, kể cả bạn.
          </p>
          {pendingCount > 0 && (
            <span className="text-sm font-semibold text-heritage-muted">
              {pendingCount} lời mời
            </span>
          )}
        </div>
        {pendingBody}
      </Panel>
      {showPasteLink && <PasteInvitationLink />}
      {invitations.isSuccess && invitations.data.ended.length > 0 && (
        <EndedInvitations items={invitations.data.ended} />
      )}
    </div>
  );
}

function PendingInvitationCard({
  invitation,
  scopeVersion,
  onAccepted,
}: {
  invitation: MyInvitation;
  scopeVersion: string;
  onAccepted: () => void;
}) {
  const checkboxId = useId();
  const client = useQueryClient();
  const action = usePrivateAction();
  const [acknowledge, setAcknowledge] = useState(false);
  const remaining = remainingTime(invitation.expiresAt);
  const respond = (accept: boolean) => {
    void action.execute(
      () => planSetupService.respondById(invitation.id, accept, acknowledge, scopeVersion),
      () => {
        if (accept) onAccepted();
        // Chấp nhận thì kho mới vào danh sách Executor và nút chuyển vai hiện ra.
        void client.invalidateQueries({ queryKey: myInvitationsKey });
        void client.invalidateQueries({ queryKey: ["executor-vaults"] });
        void client.invalidateQueries({ queryKey: ["executor"] });
      },
    );
  };
  return (
    <article
      aria-label={`Lời mời của ${invitation.ownerName}`}
      className={`space-y-4 rounded-2xl border bg-white p-5 ${remaining.expiringSoon ? "border-red-200" : "border-heritage-border"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Initial name={invitation.ownerName} className="bg-[#E3ECE6]" />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-heritage-primary">
              {invitation.ownerName}
            </h3>
            <p className="break-words text-sm text-heritage-muted">
              Mời ngày {formatDate(invitation.invitedAt)} · gửi tới {invitation.inviteeEmail}
            </p>
          </div>
        </div>
        <Chip tone={remaining.tone}>{remaining.label}</Chip>
      </div>
      {remaining.expiringSoon && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          Lời mời này sắp hết hạn. Hết hạn thì bạn không trả lời được nữa, Chủ kho phải gửi lại lời
          mời mới.
        </p>
      )}
      <div className="grid gap-5 border-t border-heritage-border pt-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">Bạn sẽ được làm gì</p>
          <ul className="mt-2 space-y-2 text-sm">
            {CAPABILITIES.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-[#1F7A55]" aria-hidden="true" />
                {item}
              </li>
            ))}
            <li className="text-red-800">
              <strong>Không</strong> đọc được nội dung kho
            </li>
          </ul>
        </div>
        <div className="space-y-3">
          <label
            htmlFor={checkboxId}
            className="flex min-h-11 items-start gap-3 rounded-xl bg-[#F4F1E6] px-4 py-3 text-sm leading-6"
          >
            <input
              id={checkboxId}
              type="checkbox"
              className="mt-1 size-5"
              checked={acknowledge}
              disabled={action.pending}
              onChange={(event) => setAcknowledge(event.target.checked)}
            />
            Tôi đã đọc phạm vi quyền ở trên và đồng ý nhận trách nhiệm này
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={buttonStyles.dark}
              disabled={action.pending || !acknowledge}
              onClick={() => respond(true)}
            >
              Chấp nhận
            </button>
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={action.pending}
              onClick={() => respond(false)}
            >
              Từ chối
            </button>
          </div>
          <p className="text-xs text-heritage-muted">
            Máy chủ ghi lại lựa chọn và thời điểm bạn bấm.
          </p>
          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

/** Lời mời gửi tới email khác email đăng nhập thì không có trong danh sách: dán link để mở trang trả lời. */
function PasteInvitationLink() {
  const inputId = useId();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = parseInvitationToken(value);
    if (!token) {
      setError("Link hoặc mã lời mời không hợp lệ. Hãy copy nguyên link trong email.");
      return;
    }
    setError("");
    setValue("");
    navigate(`${ROUTES.EXECUTOR.INVITATION}#token=${encodeURIComponent(token)}`);
  };
  return (
    <Panel
      title="Có link mời trong email mà không thấy ở trên?"
      labelledBy="paste-invitation-heading"
    >
      <p className="mb-4 text-sm text-heritage-muted">
        Lời mời được gửi tới đúng một địa chỉ email. Nếu email đó khác email bạn đang đăng nhập, dán
        link vào đây để kiểm tra.
      </p>
      <form noValidate onSubmit={submit} className="space-y-2">
        <label htmlFor={inputId} className="text-sm font-semibold">
          Link hoặc mã lời mời
        </label>
        <div className="flex flex-wrap gap-3">
          <Input
            id={inputId}
            value={value}
            autoComplete="off"
            placeholder="Dán link từ email vào đây"
            aria-invalid={Boolean(error)}
            className="min-h-11 min-w-0 flex-1"
            onChange={(event) => setValue(event.target.value)}
          />
          <button type="submit" className={buttonStyles.dark}>
            Kiểm tra lời mời
          </button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="text-xs text-heritage-muted">
          Mã này chỉ dùng một lần và không được lưu lại sau khi bạn trả lời.
        </p>
      </form>
    </Panel>
  );
}

function EndedInvitations({ items }: { items: MyInvitation[] }) {
  return (
    <details className="group rounded-2xl border border-heritage-border bg-heritage-surface p-5">
      <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-3">
        <span>
          <span className="block text-lg font-semibold text-heritage-primary">
            Lời mời đã kết thúc
          </span>
          <span className="block text-sm text-heritage-muted">
            Đã từ chối, hết hạn hoặc bị Chủ kho thu hồi. Giữ lại để bạn đối chiếu khi cần.
          </span>
        </span>
        <Chip tone="neutral">{items.length} mục · Xem</Chip>
      </summary>
      <ul className="mt-4 divide-y divide-heritage-border">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <span className="text-sm">
              <strong>{item.ownerName}</strong>
              <span className="text-heritage-muted"> · mời ngày {formatDate(item.invitedAt)}</span>
            </span>
            <span className="text-sm text-heritage-muted">
              {endedStatusLabel(item.status)}
              {item.endedAt && ` · ${formatDate(item.endedAt)}`}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
