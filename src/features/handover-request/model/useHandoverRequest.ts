import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { POLLING_INTERVAL } from "@/shared/config";
import { handoverRequestService } from "../api/handoverRequestService";
import type { AvailableHandover } from "./handoverRequest.schema";

export const handoverRequestKeys = {
  mine: ["handover-request", "mine"] as const,
  /** Một khóa duy nhất cho menu, trang Nhận tài sản, thẻ Tổng quan và trang gửi yêu cầu. */
  available: ["handover-request", "available"] as const,
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

/** Xếp dòng cần làm lên đầu, giữ nguyên thứ tự Backend trả trong từng nhóm. */
export function sortAvailable(rows: AvailableHandover[]): AvailableHandover[] {
  const needAction: AvailableHandover[] = [];
  const others: AvailableHandover[] = [];
  for (const row of rows) {
    if (row.needsAction) {
      needAction.push(row);
    } else {
      others.push(row);
    }
  }
  return [...needAction, ...others];
}

/** Số kho đang chờ người nhận làm bước tiếp theo. */
export function countNeedsAction(rows: AvailableHandover[]): number {
  let count = 0;
  for (const row of rows) {
    if (row.needsAction) {
      count += 1;
    }
  }
  return count;
}

/**
 * Các kho được để lại cho tài khoản đang đăng nhập (cùng email đã xác minh), kèm bước tiếp theo.
 * Chỉ tải khi đã có phiên; việc mới có thể tới bất cứ lúc nào nên tải lại khi quay lại tab.
 */
export function useAvailableHandovers() {
  const isAuthenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const enabled = isAuthenticated && Boolean(accessTokenMemory.get());
  return useQuery({
    queryKey: handoverRequestKeys.available,
    queryFn: async ({ signal }) => sortAvailable(await handoverRequestService.available(signal)),
    enabled,
    retry: false,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
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
