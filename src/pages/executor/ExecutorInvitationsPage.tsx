import { ExecutorHeldVaults } from "@/features/death-case/ui/ExecutorHeldVaults";
import { ExecutorInvitationsInbox } from "@/features/plan-setup/ui/ExecutorInvitationsInbox";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Lời mời và các kho bạn đang làm việc: trả lời lời mời làm Người thực thi và chọn kho để làm việc (chỗ duy nhất để đổi kho). */
export function ExecutorInvitationsPage() {
  return (
    <ExecutorWorkspace
      title="Lời mời và các kho bạn đang làm việc"
      description="Chọn kho để làm việc. Lời mời mới nằm ở trên cùng."
    >
      <div className="space-y-8">
        <ExecutorInvitationsInbox />
        <ExecutorHeldVaults />
      </div>
    </ExecutorWorkspace>
  );
}
