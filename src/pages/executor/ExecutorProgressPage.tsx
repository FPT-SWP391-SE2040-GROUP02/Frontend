import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { ExecutorProgress } from "@/features/death-case/ui/ExecutorProgress";
import { VaultGate } from "@/features/death-case/ui/VaultGate";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Bàn giao: mỗi người nhận một dòng, nhìn là biết đang ở bước nào và bạn cần làm gì. */
export function ExecutorProgressPage() {
  const state = useSelectedExecutorVault();
  return (
    <ExecutorWorkspace
      title="Bàn giao"
      description="Mỗi dòng là một người nhận. Nhìn cột Bước hiện tại để biết họ đang ở đâu và bạn cần làm gì."
    >
      <VaultGate state={state}>{(vault) => <ExecutorProgress vault={vault} />}</VaultGate>
    </ExecutorWorkspace>
  );
}
