import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { buttonStyles, Chip, Initial, Notice } from "@/shared/ui/heritageKit";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { formatDate } from "@/shared/lib/dateFormat";
import { planSetupService } from "../api/planSetupService";
import { myInvitationsKey, useMyInvitations } from "../model/useMyInvitations";
import type { MyInvitation } from "../model/myInvitations.schema";

const ABILITIES = ["Báo tin khi Chủ kho qua đời", "Theo dõi bàn giao cho người nhận"];

/**
 * Lời mời làm Người thực thi trong không gian Người thực thi. Dùng cùng API và cùng luật xác nhận với
 * MyInvitationsInbox của Chủ kho: phải tick "đã đọc" mới Chấp nhận được, Backend kiểm email và phạm vi.
 * Không hiện hạn của lời mời; lời mời đã từ chối hoặc hết hạn gom thành một dòng nhỏ.
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
            <PendingCard
              invitation={invitation}
              scopeVersion={data.scopeVersion}
              onAccepted={() => setAcceptedOwner(invitation.ownerName)}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section aria-labelledby="executor-pending-invitations" className="space-y-4">
      <h2 id="executor-pending-invitations" className="text-lg font-semibold text-heritage-primary">
        Lời mời đang chờ
      </h2>
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
  const respond = (accept: boolean) => {
    void action.execute(
      () => planSetupService.respondById(invitation.id, accept, acknowledge, scopeVersion),
      () => {
        if (accept) onAccepted();
        // Chấp nhận thì kho mới vào danh sách kho đang giữ và menu trái.
        void client.invalidateQueries({ queryKey: myInvitationsKey });
        void client.invalidateQueries({ queryKey: ["executor-vaults"] });
        void client.invalidateQueries({ queryKey: ["executor"] });
      },
    );
  };
  return (
    <article
      aria-label={`Lời mời của ${invitation.ownerName}`}
      className="space-y-4 rounded-2xl border border-[#E0C486] bg-[#FBF3E0] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
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
      <div className="grid gap-5 border-t border-[#E0C486] pt-4 md:grid-cols-2">
        <div className="text-sm">
          <p className="font-semibold">Quyền hạn của Người thực thi</p>
          <ul className="mt-2 space-y-2">
            {ABILITIES.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-[#1F7A55]" aria-hidden="true" />
                {item}
              </li>
            ))}
            <li className="text-[#A32119]">
              <strong>Không</strong> đọc được nội dung kho
            </li>
            <li className="text-heritage-muted">
              Email và số điện thoại của bạn được gửi cho người nhận khi kế hoạch được kích hoạt
            </li>
          </ul>
        </div>
        <div className="space-y-3">
          <label
            htmlFor={checkboxId}
            className="flex min-h-11 items-start gap-3 rounded-xl bg-white/70 px-4 py-3 text-sm leading-6"
          >
            <input
              id={checkboxId}
              type="checkbox"
              className="mt-1 size-5"
              checked={acknowledge}
              disabled={action.pending}
              onChange={(event) => setAcknowledge(event.target.checked)}
            />
            Tôi đã đọc và đồng ý nhận vai này
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

/** Lời mời đã từ chối, hết hạn hoặc bị thu hồi: một dòng nhỏ, bấm "Xem" để mở danh sách. */
function EndedLine({ items }: { items: MyInvitation[] }) {
  return (
    <details className="text-sm">
      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-heritage-muted">
        <span>Lời mời đã từ chối hoặc hết hạn: {items.length}</span>
        <span className="font-semibold text-heritage-primary underline">· Xem</span>
      </summary>
      <ul className="mt-2 divide-y divide-heritage-border rounded-xl border border-heritage-border bg-heritage-surface px-4">
        {items.map((item) => (
          <li key={item.id} className="py-2.5">
            <strong>{item.ownerName}</strong>
            <span className="text-heritage-muted"> · mời ngày {formatDate(item.invitedAt)}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
