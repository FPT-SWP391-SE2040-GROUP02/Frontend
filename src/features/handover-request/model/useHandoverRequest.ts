import { useQuery } from "@tanstack/react-query";
import { POLLING_INTERVAL } from "@/shared/config";
import { handoverRequestService } from "../api/handoverRequestService";

export const handoverRequestKeys = {
  mine: ["handover-request", "mine"] as const,
  owner: (vaultId: string) => ["handover-request", "owner", vaultId] as const,
};

/** Các yêu cầu nhận tài sản người đang đăng nhập đã gửi. */
export function useMyClaims() {
  return useQuery({
    queryKey: handoverRequestKeys.mine,
    queryFn: ({ signal }) => handoverRequestService.mine(signal),
    retry: false,
    refetchInterval: POLLING_INTERVAL.NORMAL,
    refetchIntervalInBackground: false,
  });
}

/** Yêu cầu nhận tài sản đang mở của kho (Chủ kho); null khi không có. */
export function useOwnerRequest(vaultId: string) {
  return useQuery({
    queryKey: handoverRequestKeys.owner(vaultId),
    queryFn: ({ signal }) => handoverRequestService.ownerRequest(vaultId, signal),
    retry: false,
    refetchInterval: POLLING_INTERVAL.NORMAL,
    refetchIntervalInBackground: false,
  });
}
