import { useQuery, type QueryClient } from "@tanstack/react-query";
import { assignmentService } from "../api/assignmentService";

/** Cache riêng theo kho; đổi tài khoản thì cache bị xóa như các dữ liệu riêng tư khác. */
export const assignmentKeys = {
  list: (vaultId: string) => ["vault-assignments", vaultId] as const,
};

/** Mọi dòng gán của kho. Không gửi request khi chưa biết vaultId. */
export function useAssignments(vaultId: string) {
  return useQuery({
    queryKey: assignmentKeys.list(vaultId),
    queryFn: ({ signal }) => assignmentService.list(vaultId, signal),
    enabled: Boolean(vaultId),
    retry: false,
  });
}

/** Làm mới mọi nơi đang đọc dữ liệu bị ảnh hưởng khi gán hoặc gỡ gán tài sản. */
export function invalidateAssignmentQueries(client: QueryClient, vaultId: string): void {
  void client.invalidateQueries({ queryKey: assignmentKeys.list(vaultId) });
  void client.invalidateQueries({ queryKey: ["owner-vault"] });
  void client.invalidateQueries({ queryKey: ["vault-assets", vaultId] });
  void client.invalidateQueries({ queryKey: ["vault-beneficiaries", vaultId] });
  void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
}
