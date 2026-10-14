import { useQuery } from "@tanstack/react-query";
import type { PaginationParams } from "@/shared/types";
import { backendAssetService } from "../api/backendAssetService";
/** Scope kho và pagination; auth transitions clear private cache. */
export function useVaultAssets(vaultId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: ["vault-assets", vaultId, params ?? {}],
    queryFn: ({ signal }) => backendAssetService.list(vaultId, params, signal),
    enabled: Boolean(vaultId),
    retry: false,
  });
}
