import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { countVaultsNeedingAttention } from "@/features/death-case/model/executorVaultTask";
import { ExecutorOverview } from "@/features/death-case/ui/ExecutorOverview";
import { VaultGate } from "@/features/death-case/ui/VaultGate";
import { Chip } from "@/shared/ui/heritageKit";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/**
 * Tổng quan Người thực hiện. Nhiều kho mà chưa chọn thì vào thẳng danh sách kho kèm việc cần làm
 * (không còn bước "Chọn kho" riêng); đã chọn thì hiện Tổng quan của kho đó.
 */
export function ExecutorOverviewPage() {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const state = useSelectedExecutorVault();
  const listing = state.vaults.length > 1 && !state.selected;

  let title = "Tổng quan";
  if (user?.fullName) title = `Chào ${user.fullName}`;

  let description = "Các kho bạn được tin tưởng giao vai trò Người thực hiện.";
  if (listing) {
    description = `Bạn là Người thực hiện cho ${state.vaults.length} kho.`;
  } else if (state.selected) {
    description = `${state.selected.ownerFullName} đã tin tưởng giao bạn vai trò Người thực hiện.`;
  }

  let badge = null;
  if (listing) {
    const needing = countVaultsNeedingAttention(state.vaults);
    if (needing > 0) badge = <Chip tone="danger">{needing} kho đang cần bạn</Chip>;
  }

  return (
    <ExecutorWorkspace title={title} description={description} badge={badge}>
      <VaultGate state={state}>{(vault) => <ExecutorOverview vault={vault} />}</VaultGate>
    </ExecutorWorkspace>
  );
}
