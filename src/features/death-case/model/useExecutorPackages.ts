import { useQuery } from "@tanstack/react-query";
import { deathCaseService } from "../api/deathCaseService";

/** Khóa cache danh sách tài sản theo kho. */
export const executorPackagesKey = (vaultId: string) => ["executor-packages", vaultId] as const;

/** Các gói bàn giao của kho kèm tài sản và người nhận (chỉ danh sách). Không retry để 403/404 không bị gọi lặp. */
export function useExecutorPackages(vaultId: string | null | undefined) {
  return useQuery({
    queryKey: executorPackagesKey(vaultId ?? ""),
    queryFn: ({ signal }) => deathCaseService.packages(vaultId!, signal),
    enabled: Boolean(vaultId),
    retry: false,
  });
}
