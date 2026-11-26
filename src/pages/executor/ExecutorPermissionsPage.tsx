import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { ExecutorPermissions } from "@/features/death-case/ui/ExecutorPermissions";
import { ExecutorReceivedKeyCard } from "@/entities/executor";
import { loginMethodsService } from "@/features/auth/api/loginMethodsService";

/** Quyền hạn của Người thực thi (nằm trong thẻ Quyền hạn của trang Cài đặt). Quyền giống nhau ở mọi kho. */
export function ExecutorPermissionsSection() {
  const { query, selected } = useSelectedExecutorVault();
  if (query.isPending) return <p role="status">Đang tải các tài sản được phân công…</p>;
  if (query.isError) return <p role="alert">Không tải được các tài sản được phân công.</p>;
  return (
    <div className="space-y-6">
      {selected && (
        <ExecutorReceivedKeyCard
          key={selected.vaultId}
          vaultId={selected.vaultId}
          planStatus={selected.planStatus}
          verifyPassword={(password) =>
            loginMethodsService.verifyPassword({ currentPassword: password })
          }
        />
      )}
      <ExecutorPermissions selected={selected} />
    </div>
  );
}
