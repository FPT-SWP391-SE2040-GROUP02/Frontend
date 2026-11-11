import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { ExecutorPermissions } from "@/features/death-case/ui/ExecutorPermissions";

/** Quyền hạn của Người thực thi (nằm trong thẻ Quyền hạn của trang Cài đặt). Quyền giống nhau ở mọi kho. */
export function ExecutorPermissionsSection() {
  const { query, selected } = useSelectedExecutorVault();
  if (query.isPending) return <p role="status">Đang tải các kho được phân công…</p>;
  if (query.isError) return <p role="alert">Không tải được các kho được phân công.</p>;
  return <ExecutorPermissions selected={selected} />;
}
