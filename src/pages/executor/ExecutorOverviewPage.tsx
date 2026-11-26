import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { ExecutorOverview } from "@/features/death-case/ui/ExecutorOverview";
import { VaultGate } from "@/features/death-case/ui/VaultGate";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";
import { ExecutorReceivedKeyCard } from "@/entities/executor";
import { loginMethodsService } from "@/features/auth/api/loginMethodsService";
import { useMyInvitations } from "@/features/plan-setup/model/useMyInvitations";
import { MyInvitationsBanner } from "@/features/plan-setup/ui/MyInvitationsBanner";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * Tổng quan Người thực thi của kho đang chọn. Kho đầu tiên được tự chọn khi chưa chọn kho nào;
 * đổi kho chỉ làm ở trang "Lời mời và các kho bạn đang làm việc".
 */
export function ExecutorOverviewPage() {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const state = useSelectedExecutorVault();
  const invitations = useMyInvitations();
  const hasPending = invitations.isSuccess && invitations.data.pending.length > 0;
  // Chưa giữ kho nào mà đang có lời mời: chỉ hiện khung mời, không kèm thẻ "Chưa có kho nào".
  const onlyInvitation = hasPending && state.query.isSuccess && state.vaults.length === 0;

  let title = "Tổng quan";
  if (user?.fullName) title = `Chào ${user.fullName}`;

  let description = "Các tài sản bạn được tin tưởng giao vai trò Người thực thi.";
  if (state.selected) {
    title = `Tài sản của ${state.selected.ownerFullName}`;
    description = "Bạn là Người thực thi của tài sản này. Bạn không đọc được nội dung tài sản.";
  }

  return (
    <ExecutorWorkspace title={title} description={description}>
      <MyInvitationsBanner invitationsHref={ROUTES.EXECUTOR.INVITATIONS} />
      {!onlyInvitation && (
        <VaultGate state={state}>
          {(vault) => (
            <div className="space-y-6">
              <ExecutorOverview vault={vault} />
              <ExecutorReceivedKeyCard
                key={vault.vaultId}
                vaultId={vault.vaultId}
                planStatus={vault.planStatus}
                verifyPassword={(password) =>
                  loginMethodsService.verifyPassword({ currentPassword: password })
                }
              />
            </div>
          )}
        </VaultGate>
      )}
    </ExecutorWorkspace>
  );
}
