import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { ExecutorAssetList } from "@/features/death-case/ui/ExecutorAssetList";
import { VaultGate } from "@/features/death-case/ui/VaultGate";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Tài sản và hướng dẫn của kho theo từng gói bàn giao. Chỉ danh sách, không có nội dung. */
export function ExecutorAssetsPage() {
  const state = useSelectedExecutorVault();
  return (
    <ExecutorWorkspace
      title="Tài sản và hướng dẫn"
      description="Những tài sản Chủ kho giao bạn quản lý việc bàn giao. Bạn thấy tên và người nhận, không mở được nội dung."
    >
      <VaultGate state={state}>{(vault) => <ExecutorAssetList vault={vault} />}</VaultGate>
    </ExecutorWorkspace>
  );
}
