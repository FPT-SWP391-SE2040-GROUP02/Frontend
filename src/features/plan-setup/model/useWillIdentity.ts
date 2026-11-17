import { useQuery } from "@tanstack/react-query";
import { planSetupService } from "../api/planSetupService";

/** Khóa cache danh tính lập di chúc; làm mới sau khi ký lại. */
export function willIdentityQueryKey(vaultId: string): readonly ["will-identity", string] {
  return ["will-identity", vaultId];
}

/**
 * Danh tính đầy đủ (CCCD, ngày sinh, thường trú) để in trong di chúc. Chỉ bật khi khung xem trước đang mở. Không giữ
 * trong cache: staleTime 0 và gcTime 0 để dữ liệu nhạy cảm mất ngay khi khung đóng; không tự gọi lại, không retry.
 */
export function useWillIdentity(vaultId: string, enabled: boolean) {
  return useQuery({
    queryKey: willIdentityQueryKey(vaultId),
    queryFn: ({ signal }) => planSetupService.getWillIdentity(vaultId, signal),
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
