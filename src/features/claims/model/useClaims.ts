import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExecutorClaims, submitClaim } from "../api/claimService";
import type { PaginationParams } from "@/shared/types";
import type { SubmitClaimRequest } from "./claim.types";

/**
 * @file useClaims.ts
 * @description Custom React Query Hooks cho phân hệ Executor Claims.
 * Tự động cache và invalidate dữ liệu khi nộp hồ sơ mới.
 */

export const claimKeys = {
  all: ["executor-claims"] as const,
  lists: () => [...claimKeys.all, "list"] as const,
  list: (params?: PaginationParams) => [...claimKeys.lists(), params] as const,
};

/**
 * Hook truy xuất danh sách hồ sơ của Người thi hành
 */
export function useExecutorClaims(params?: PaginationParams) {
  return useQuery({
    queryKey: claimKeys.list(params),
    queryFn: () => getExecutorClaims(params),
  });
}

/**
 * Hook nộp hồ sơ mở thừa kế
 */
export function useSubmitClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitClaimRequest) => submitClaim(payload),
    onSuccess: () => {
      // Invalidate cache để cập nhật danh sách hồ sơ tức thì
      queryClient.invalidateQueries({ queryKey: claimKeys.lists() });
    },
  });
}
