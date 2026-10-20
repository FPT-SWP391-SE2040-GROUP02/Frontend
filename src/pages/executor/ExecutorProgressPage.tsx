import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { ExecutorProgress } from "@/features/death-case/ui/ExecutorProgress";
import { VaultGate } from "@/features/death-case/ui/VaultGate";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Tiến trình bàn giao: 6 bước, nhật ký và tiến độ từng người nhận. Chỉ đọc. */
export function ExecutorProgressPage() {
  const state = useSelectedExecutorVault();
  return (
    <ExecutorWorkspace
      title="Tiến trình bàn giao"
      description="Theo dõi từng bước. Bạn không cần làm gì thêm."
    >
      <VaultGate state={state}>{(vault) => <ExecutorProgress vault={vault} />}</VaultGate>
    </ExecutorWorkspace>
  );
}
