import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Info } from "lucide-react";
import { buttonStyles, Chip, Initial, Notice } from "@/shared/ui/heritageKit";
import { formatDate } from "@/shared/lib/dateFormat";
import { planSetupService } from "../api/planSetupService";
import { myInvitationsKey, useMyInvitations } from "../model/useMyInvitations";
import type { MyInvitation } from "../model/myInvitations.schema";
import { useExecutorSigning } from "../model/useExecutorSigning";
import { InvitationPaper } from "./InvitationPaper";
import { ExecutorSigningPasswordField } from "./ExecutorSigningPasswordField";
import { ActionButton } from "@/shared/ui/ActionButton";
import { DeclineConfirmDialog } from "@/shared/ui/DeclineConfirmDialog";
import { endedStatusLabel } from "../lib/myInvitationHelpers";
import { SigningStep, SigningSteps, type SigningStepState } from "@/shared/ui/SigningSteps";

/**
 * Lời mời làm Người thực thi trong không gian Người thực thi. Dùng cùng API và cùng luật xác nhận với
 * MyInvitationsInbox của Chủ kho: phải tick "đã đọc" mới Chấp nhận được, Backend kiểm email và phạm vi.
 * Không hiện hạn của lời mời; lời mời đã kết thúc gom thành một dòng nhỏ.
 */
export function ExecutorInvitationsInbox() {
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
    // Không có lời mời chờ thì không hiện nhãn hay câu nào cho phần này.
    pendingBody = null;
  } else {
    const data = invitations.data;
    pendingBody = (
      <ul className="space-y-4">
        {data.pending.map((invitation) => (
          <li key={invitation.id}>
            <PendingCard
              invitation={invitation}
              scopeVersion={data.scopeVersion}
              scopeText={data.scopeText}
              onAccepted={() => setAcceptedOwner(invitation.ownerName)}
            />
          </li>
        ))}
      </ul>
    );
  }

  const hasPending = invitations.isSuccess && invitations.data.pending.length > 0;
  const hasEnded = invitations.isSuccess && invitations.data.ended.length > 0;
  // Không có gì để hiện (không lời mời chờ, không lời mời đã kết thúc, không thông báo vừa chấp nhận): bỏ cả khối.
  if (invitations.isSuccess && !hasPending && !hasEnded && !acceptedOwner) return null;
  return (
    <section
      aria-labelledby={hasPending ? "executor-pending-invitations" : undefined}
      className="space-y-4"
    >
      {hasPending && (
        <h2
          id="executor-pending-invitations"
          className="text-lg font-semibold text-heritage-primary"
        >
          Lời mời đang chờ
        </h2>
      )}
      {acceptedOwner && (
        <Notice tone="success" role="status" title="Bạn đã là Người thực thi">
          Kho của {acceptedOwner} đã nằm trong danh sách kho bạn đang giữ ở bên dưới.
        </Notice>
      )}
      {pendingBody}
      {invitations.isSuccess && invitations.data.ended.length > 0 && (
        <EndedLine items={invitations.data.ended} />
      )}
    </section>
  );
}

function PendingCard({
  invitation,
  scopeVersion,
  scopeText,
  onAccepted,
}: {
  invitation: MyInvitation;
  scopeVersion: string;
  scopeText: string;
  onAccepted: () => void;
}) {
  const checkboxId = useId();
  const client = useQueryClient();
  const [acknowledge, setAcknowledge] = useState(false);
  // Phiên bản đã mở xem; Chủ kho ký bản khác thì phải xem lại và tick lại.
  const [readVersion, setReadVersion] = useState<number | null>(null);
  const versionNo = invitation.willVersionNo ?? null;
  const read = invitation.willReady && versionNo !== null && readVersion === versionNo;
  const agreed = acknowledge && read;
  const [askingDecline, setAskingDecline] = useState(false);
  const {
    action,
    password,
    setPassword,
    passwordError,
    respond: sign,
    signing,
    signed,
  } = useExecutorSigning();
  // Đọc biên bản xong mới mở khóa bước đồng ý và bước nhập mật khẩu.
  let readState: SigningStepState = "current";
  let agreeState: SigningStepState = "locked";
  let passwordState: SigningStepState = "locked";
  let lockedPlaceholder: string | undefined = "Mở biên bản trước";
  if (read) {
    readState = "done";
    agreeState = "current";
    passwordState = "current";
    lockedPlaceholder = undefined;
  }
  if (agreed) {
    agreeState = "done";
  }
  const respond = (accept: boolean) =>
    sign(
      accept,
      (signingPassword) =>
        planSetupService.respondById(
          invitation.id,
          accept,
          agreed,
          scopeVersion,
          signingPassword,
          versionNo,
        ),
      () => {
        if (accept) onAccepted();
        // Chấp nhận thì kho mới vào danh sách kho đang giữ và menu trái.
        void client.invalidateQueries({ queryKey: myInvitationsKey });
        void client.invalidateQueries({ queryKey: ["executor-vaults"] });
        void client.invalidateQueries({ queryKey: ["executor"] });
      },
    );
  return (
    <article
      aria-label={`Lời mời của ${invitation.ownerName}`}
      className="overflow-hidden rounded-2xl border border-heritage-border bg-heritage-surface shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-heritage-border px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Initial name={invitation.ownerName} />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-heritage-primary">
              {invitation.ownerName} mời bạn làm Người thực thi
            </h3>
            <p className="text-sm text-heritage-muted">
              Mời ngày {formatDate(invitation.invitedAt)}
            </p>
          </div>
        </div>
        <Chip tone="warning">Chờ bạn trả lời</Chip>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5 p-5 text-sm leading-6 sm:p-6">
          <p className="max-w-prose whitespace-pre-line">{scopeText}</p>
          <p className="flex max-w-prose items-start gap-3 border-t border-heritage-border pt-4 text-heritage-muted">
            <Info className="mt-1 size-4 shrink-0" aria-hidden="true" />
            Email và số điện thoại của bạn được gửi cho người nhận khi kế hoạch được kích hoạt
          </p>
        </div>
        <div className="space-y-4 border-t border-heritage-border bg-heritage-sunken p-5 sm:p-6 lg:border-l lg:border-t-0">
          <SigningSteps>
            <SigningStep number={1} title="Đọc biên bản" state={readState}>
              <InvitationPaper
                asStep
                invitation={invitation}
                read={read}
                onRead={() => {
                  setAcknowledge(false);
                  setReadVersion(versionNo);
                }}
              />
            </SigningStep>
            <SigningStep number={2} title="Đồng ý" state={agreeState}>
              <label
                htmlFor={checkboxId}
                className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6"
              >
                <input
                  id={checkboxId}
                  type="checkbox"
                  className="mt-0.5 size-5 shrink-0 accent-heritage-primary"
                  checked={agreed}
                  disabled={action.pending || !read}
                  onChange={(event) => setAcknowledge(event.target.checked)}
                />
                Tôi đã đọc biên bản phân chia, phạm vi công việc và đồng ý nhận vai Người thực thi
              </label>
            </SigningStep>
            <SigningStep number={3} title="Ký bằng mật khẩu" state={passwordState}>
              <ExecutorSigningPasswordField
                hideHelp
                lockedPlaceholder={lockedPlaceholder}
                value={password}
                onChange={setPassword}
                disabled={action.pending || !read}
                error={passwordError}
              />
            </SigningStep>
          </SigningSteps>
          {invitation.willReady ? (
            <div className="flex flex-wrap gap-3 pt-1">
              <ActionButton
                className={`${buttonStyles.dark} flex-1`}
                disabled={action.pending || !agreed || password.length === 0}
                onClick={() => respond(true)}
                pending={signing}
                done={signed}
                pendingLabel="Đang ký…"
                doneLabel="Đã ký"
              >
                Ký nhận vai
              </ActionButton>
              <button
                type="button"
                className={buttonStyles.outline}
                disabled={action.pending}
                onClick={() => setAskingDecline(true)}
              >
                Từ chối
              </button>
            </div>
          ) : (
            <p role="status" className="text-sm leading-6 text-heritage-muted">
              Chủ kho chưa ký biên bản phân chia. Khi Chủ kho ký xong, bạn mới ký nhận vai hoặc từ
              chối được.
            </p>
          )}
          {action.error && passwordError === null && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
        </div>
      </div>
      {askingDecline && (
        <DeclineConfirmDialog
          title="Từ chối lời mời này?"
          description={`Bạn sẽ không làm Người thực thi cho kho của ${invitation.ownerName}. Muốn nhận lại thì Chủ kho phải gửi lời mời mới.`}
          confirmLabel="Từ chối lời mời"
          onClose={() => setAskingDecline(false)}
          onConfirm={() => {
            setAskingDecline(false);
            respond(false);
          }}
        />
      )}
    </article>
  );
}

/**
 * Lời mời đã từ chối, hết hạn hoặc bị thu hồi: một dòng gọn, bấm để mở danh sách kèm lý do. Các class có "!" bỏ viền,
 * nền và bóng kiểu thẻ mà owner-workspace.css gắn cho mọi <details>.
 */
function EndedLine({ items }: { items: MyInvitation[] }) {
  return (
    <details className="group rounded-none! border-0! bg-transparent! py-0! text-sm shadow-none!">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-2 font-semibold text-heritage-muted hover:text-heritage-primary">
        <ChevronRight
          className="size-4 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none"
          aria-hidden="true"
        />
        Lời mời cũ ({items.length})
      </summary>
      <ul className="mt-1 divide-y divide-heritage-border rounded-xl border border-heritage-border bg-heritage-surface px-4">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3">
            <span>
              <strong>{item.ownerName}</strong>
              <span className="text-heritage-muted"> · mời ngày {formatDate(item.invitedAt)}</span>
            </span>
            <span className="text-heritage-muted">
              {endedStatusLabel(item.status)}
              {item.endedAt && ` · ${formatDate(item.endedAt)}`}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
