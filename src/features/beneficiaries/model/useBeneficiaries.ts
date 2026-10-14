import { useQuery } from "@tanstack/react-query";
import type { PaginationParams } from "@/shared/types";
import { beneficiaryService } from "../api/beneficiaryService";
/** Không đưa CCCD đầy đủ vào cache; chỉ DTO public đã parse. */
export function useBeneficiaries(vaultId: string, params?: PaginationParams) {
  return useQuery({
    queryKey: ["vault-beneficiaries", vaultId, params ?? {}],
    queryFn: ({ signal }) => beneficiaryService.list(vaultId, params, signal),
    enabled: Boolean(vaultId),
    retry: false,
  });
}
