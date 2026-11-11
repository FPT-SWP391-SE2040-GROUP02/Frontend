import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { getVaultLockReason } from "@/entities/vault/model/vaultLock";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { useOwnerVault } from "./useOwnerVault";

/**
 * Lý do kho của Chủ kho đang bị khóa (hồ sơ chứng tử, bàn giao, bị chặn, đã đóng), hoặc null khi còn thao tác được.
 * Dùng chung cache kho với các màn khác nên gọi ở nhiều nút không tạo thêm request.
 */
export function useOwnerVaultLock(): string | null {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const vault = useOwnerVault(authenticated && Boolean(accessTokenMemory.get()));
  return getVaultLockReason(vault.data);
}
