import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { ExecutorOverview } from "@/features/death-case/ui/ExecutorOverview";
import { VaultGate } from "@/features/death-case/ui/VaultGate";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Tổng quan Người thực hiện; có nhiều kho mà chưa chọn thì hiện bước "Chọn kho". */
export function ExecutorOverviewPage() {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const state = useSelectedExecutorVault();
  const choosing = state.vaults.length > 1 && !state.selected;
  return (
    <ExecutorWorkspace
      title={choosing ? "Chọn kho" : user?.fullName ? `Chào ${user.fullName}` : "Tổng quan"}
      description={
        choosing
          ? "Bạn đang là người thực hiện của nhiều kho. Chọn kho cần làm việc."
          : state.selected
            ? `${state.selected.ownerFullName} đã tin tưởng giao bạn vai trò Người thực hiện.`
            : "Các kho bạn được tin tưởng giao vai trò Người thực hiện."
      }
    >
      <VaultGate state={state}>{(vault) => <ExecutorOverview vault={vault} />}</VaultGate>
    </ExecutorWorkspace>
  );
}
