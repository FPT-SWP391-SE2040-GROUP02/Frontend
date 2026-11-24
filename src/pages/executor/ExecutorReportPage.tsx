import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { ExecutorRecordPanel } from "@/entities/handoverRecord";
import { VaultGate } from "@/features/death-case/ui/VaultGate";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Biên bản bàn giao: theo dõi ba bước và ký khi tới lượt. */
export function ExecutorReportPage() {
  const state = useSelectedExecutorVault();
  return (
    <ExecutorWorkspace
      title="Biên bản bàn giao"
      description="Luật sư lập biên bản và xác nhận đúng người nhận. Bạn giữ hộ và giao đúng biên bản."
    >
      <VaultGate state={state}>
        {(vault) => <ExecutorRecordPanel vaultId={vault.vaultId} />}
      </VaultGate>
    </ExecutorWorkspace>
  );
}
