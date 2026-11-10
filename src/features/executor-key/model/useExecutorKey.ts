import { useQuery } from "@tanstack/react-query";
import { executorKeyService } from "../api/executorKeyService";

/** Cache riêng theo kho; chỉ giữ trạng thái, không bao giờ giữ mã gốc. */
export const executorKeyKeys = {
  status: (vaultId: string) => ["executor-key", vaultId, "status"] as const,
};

export function useExecutorKeyStatus(vaultId: string, enabled = true) {
  return useQuery({
    queryKey: executorKeyKeys.status(vaultId),
    queryFn: ({ signal }) => executorKeyService.getStatus(vaultId, signal),
    enabled: enabled && Boolean(vaultId),
    retry: false,
  });
}
