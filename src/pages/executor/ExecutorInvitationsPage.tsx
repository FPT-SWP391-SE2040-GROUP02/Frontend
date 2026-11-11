import { ExecutorHeldVaults } from "@/features/death-case/ui/ExecutorHeldVaults";
import { ExecutorInvitationsInbox } from "@/features/plan-setup/ui/ExecutorInvitationsInbox";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Lời mời và kho của tôi: trả lời lời mời làm Người thực thi và mở các kho đang giữ. */
export function ExecutorInvitationsPage() {
  return (
    <ExecutorWorkspace
      title="Lời mời và kho của tôi"
      description="Ai mời bạn làm Người thực thi, và những kho bạn đang giữ vai này."
    >
      <div className="space-y-8">
        <ExecutorInvitationsInbox />
        <ExecutorHeldVaults />
      </div>
    </ExecutorWorkspace>
  );
}
