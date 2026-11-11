import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { ExecutorOverview } from "@/features/death-case/ui/ExecutorOverview";
import { VaultGate } from "@/features/death-case/ui/VaultGate";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/**
 * Tổng quan Người thực thi của kho đang chọn. Kho đầu tiên được tự chọn khi chưa chọn kho nào;
 * đổi kho chỉ làm ở trang "Lời mời và các kho bạn đang làm việc".
 */
export function ExecutorOverviewPage() {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const state = useSelectedExecutorVault();

  let title = "Tổng quan";
  if (user?.fullName) title = `Chào ${user.fullName}`;

  let description = "Các kho bạn được tin tưởng giao vai trò Người thực thi.";
  if (state.selected) {
    title = `Kho của ${state.selected.ownerFullName}`;
    description = "Bạn là Người thực thi của kho này. Bạn không đọc được nội dung kho.";
  }

  return (
    <ExecutorWorkspace title={title} description={description}>
      <VaultGate state={state}>{(vault) => <ExecutorOverview vault={vault} />}</VaultGate>
    </ExecutorWorkspace>
  );
}
