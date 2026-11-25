import { useQuery } from "@tanstack/react-query";
import { deathCaseService } from "../api/deathCaseService";

/** Khóa cache danh sách tên và loại tài sản theo kho. */
export const executorAssetNamesKey = (vaultId: string) =>
  ["executor-asset-names", vaultId] as const;

/**
 * Tên và loại tài sản của kho, xem được cả trước khi bàn giao. `enabled` chỉ bật khi danh sách theo người nhận còn
 * khóa, để không gọi thừa sau khi đã bàn giao.
 */
export function useExecutorAssetNames(vaultId: string, enabled: boolean) {
  return useQuery({
    queryKey: executorAssetNamesKey(vaultId),
    queryFn: ({ signal }) => deathCaseService.assetNames(vaultId, signal),
    enabled,
    retry: false,
  });
}
