import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingClaims, approveClaim, rejectClaim } from "../api/notaryService";
import type { PaginationParams } from "@/shared/types";
import type { ApproveClaimRequest, RejectClaimRequest } from "./notary.types";

/**
 * @file useNotaryClaims.ts
 * @description Custom React Query Hooks cho phân hệ Công Chứng Viên (Notary Verification).
 */

export const notaryKeys = {
  all: ["notary-claims"] as const,
  pending: (params?: PaginationParams) => [...notaryKeys.all, "pending", params] as const,
};

/**
 * Hook lấy danh sách hồ sơ đang chờ công chứng viên thẩm định
 */
export function usePendingClaims(params?: PaginationParams) {
  return useQuery({
    queryKey: notaryKeys.pending(params),
    queryFn: () => getPendingClaims(params),
  });
}

/**
 * Hook phê duyệt hồ sơ và giải phóng Mảnh khóa Verifier
 */
export function useApproveClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApproveClaimRequest) => approveClaim(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notaryKeys.all });
    },
  });
}

/**
 * Hook từ chối hồ sơ và yêu cầu bổ sung
 */
export function useRejectClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RejectClaimRequest) => rejectClaim(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notaryKeys.all });
    },
  });
}
