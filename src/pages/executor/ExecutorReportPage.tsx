import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { ExecutorRecordPanel } from "@/entities/handoverRecord";
import { ExecutorWillButton } from "@/features/death-case/ui/ExecutorWillButton";
import { VaultGate } from "@/features/death-case/ui/VaultGate";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Biên bản bàn giao: theo dõi ba bước và ký khi tới lượt. */
export function ExecutorReportPage() {
  const state = useSelectedExecutorVault();
  return (
    <ExecutorWorkspace
      title="Biên bản bàn giao"
      description="Luật sư lập phương án chia và xác nhận đúng người nhận. Bạn giữ hộ và giao đúng biên bản."
    >
      <VaultGate state={state}>
        {(vault) => (
          <div className="space-y-6">
            <ExecutorWillButton vault={vault} />
            <ExecutorRecordPanel vaultId={vault.vaultId} />
          </div>
        )}
      </VaultGate>
    </ExecutorWorkspace>
  );
}
