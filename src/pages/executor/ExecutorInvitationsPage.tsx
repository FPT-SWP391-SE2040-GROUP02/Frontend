import { InvitationsContent } from "@/pages/dashboard/InvitationsPage";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Lời mời trong không gian Người thực hiện (cùng nội dung với bên Chủ kho). */
export function ExecutorInvitationsPage() {
  return (
    <ExecutorWorkspace
      title="Lời mời"
      description="Ai mời bạn làm Người thực hiện, bạn nhận hay từ chối, và bạn đang nhận trách nhiệm cho những kho nào."
    >
      <InvitationsContent showPasteLink />
    </ExecutorWorkspace>
  );
}
