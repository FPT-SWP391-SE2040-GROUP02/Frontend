import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { ExecutorProgress } from "@/features/death-case/ui/ExecutorProgress";
import { VaultGate } from "@/features/death-case/ui/VaultGate";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Bàn giao: nhật ký hồ sơ và tiến độ từng người nhận. Chỉ đọc. */
export function ExecutorProgressPage() {
  const state = useSelectedExecutorVault();
  return (
    <ExecutorWorkspace
      title="Bàn giao"
      description="Theo dõi hồ sơ và tiến độ nhận tài sản của từng người nhận."
    >
      <VaultGate state={state}>{(vault) => <ExecutorProgress vault={vault} />}</VaultGate>
    </ExecutorWorkspace>
  );
}
