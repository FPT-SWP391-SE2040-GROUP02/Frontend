import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { ExecutorPermissions } from "@/features/death-case/ui/ExecutorPermissions";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Quyền hạn của Người thực hiện. Không cần chọn kho vì quyền giống nhau ở mọi kho. */
export function ExecutorPermissionsPage() {
  const { query, vaults, selected } = useSelectedExecutorVault();
  return (
    <ExecutorWorkspace
      title="Quyền hạn của bạn"
      description="Vai trò Người thực hiện giúp báo tin và theo dõi. Bạn không đọc được nội dung kho."
    >
      {query.isPending ? (
        <p role="status">Đang tải các kho được phân công…</p>
      ) : query.isError ? (
        <p role="alert">Không tải được các kho được phân công.</p>
      ) : (
        <ExecutorPermissions vaults={vaults} selected={selected} />
      )}
    </ExecutorWorkspace>
  );
}
