import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { ExecutorAssetList } from "@/features/death-case/ui/ExecutorAssetList";
import { VaultGate } from "@/features/death-case/ui/VaultGate";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Tài sản của kho theo từng gói bàn giao. Chỉ danh sách, không có nội dung. */
export function ExecutorAssetsPage() {
  const state = useSelectedExecutorVault();
  return (
    <ExecutorWorkspace
      title="Tài sản"
      description="Danh sách tài sản trong kho, theo từng gói bàn giao."
    >
      <VaultGate state={state}>{(vault) => <ExecutorAssetList vault={vault} />}</VaultGate>
    </ExecutorWorkspace>
  );
}
