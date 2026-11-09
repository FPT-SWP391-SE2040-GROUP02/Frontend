import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { AccountSettingsContent } from "@/pages/dashboard/AccountSettingsPage";
import { InvitationsContent } from "@/pages/dashboard/InvitationsPage";
import { useMyInvitations } from "@/features/plan-setup/model/useMyInvitations";
import { ExecutorPermissionsSection } from "@/pages/executor/ExecutorPermissionsPage";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Thẻ bật ra bật vào: tiêu đề luôn thấy, nội dung mở khi bấm. */
function CollapsibleCard({
  id,
  title,
  hint,
  defaultOpen,
  children,
}: {
  id: string;
  title: string;
  hint?: ReactNode;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group rounded-2xl border border-heritage-border bg-heritage-surface"
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 focus-visible:outline-2 focus-visible:outline-heritage-gold">
        <span className="flex items-center gap-3 text-lg font-medium text-heritage-primary">
          {title}
          {hint}
        </span>
        <ChevronDown
          className="size-5 shrink-0 text-heritage-muted transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-heritage-border p-6">{children}</div>
    </details>
  );
}

/** Cài đặt trong không gian Người thực thi: tài khoản, kèm hai thẻ Lời mời và Quyền hạn bật ra bật vào. */
export function ExecutorSettingsPage() {
  const [params] = useSearchParams();
  const open = params.get("open");
  const invitations = useMyInvitations(true);
  const pending = invitations.isSuccess ? invitations.data.pending.length : 0;
  return (
    <ExecutorWorkspace
      title="Cài đặt"
      description="Thông tin cá nhân, bảo mật, lời mời và quyền hạn của bạn. Vai trò do hệ thống cấp, bạn không đọc được nội dung kho."
    >
      <div className="space-y-6">
        <AccountSettingsContent showVaultPin={false} />
        <CollapsibleCard
          id="invitations"
          title="Lời mời"
          defaultOpen={open === "invitations" || pending > 0}
          hint={
            pending > 0 ? (
              <span className="rounded-full bg-[#E0C486] px-2 py-0.5 text-xs font-semibold text-[#0A281E]">
                {pending} mới
              </span>
            ) : null
          }
        >
          <InvitationsContent inExecutorWorkspace />
        </CollapsibleCard>
        <CollapsibleCard id="permissions" title="Quyền hạn" defaultOpen={open === "permissions"}>
          <ExecutorPermissionsSection />
        </CollapsibleCard>
      </div>
    </ExecutorWorkspace>
  );
}
