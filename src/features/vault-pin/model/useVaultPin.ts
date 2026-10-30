import { useQuery } from "@tanstack/react-query";
import { vaultPinService } from "../api/vaultPinService";

/** Cache riêng theo kho; auth transitions xóa dữ liệu khi đổi identity. */
export const vaultPinKeys = {
  status: (vaultId: string) => ["vault-pin", vaultId, "status"] as const,
};

/** Trạng thái PIN của kho; chỉ đọc khi đã biết vaultId. */
export function useVaultPinStatus(vaultId: string, enabled = true) {
  return useQuery({
    queryKey: vaultPinKeys.status(vaultId),
    queryFn: ({ signal }) => vaultPinService.getStatus(vaultId, signal),
    enabled: enabled && Boolean(vaultId),
    retry: false,
  });
}
