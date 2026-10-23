import { useQuery } from "@tanstack/react-query";
import { twoFactorService } from "../api/twoFactorService";

/** Cache theo phiên; `queryClient.clear()` khi đổi danh tính xóa luôn trạng thái 2FA. */
export const twoFactorKeys = {
  status: ["auth", "2fa", "status"] as const,
};

/** Trạng thái TOTP của Admin đang đăng nhập (chỉ gọi khi vai trò Admin). */
export function useTwoFactorStatus(enabled: boolean) {
  return useQuery({
    queryKey: twoFactorKeys.status,
    queryFn: ({ signal }) => twoFactorService.status(signal),
    enabled,
    retry: false,
  });
}
