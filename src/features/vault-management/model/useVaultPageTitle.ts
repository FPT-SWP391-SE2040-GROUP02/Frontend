import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { useOwnerVault } from "./useOwnerVault";
import { vaultPageTitle, type VaultPageTitle } from "./vaultPageTitle";

/**
 * Tiêu đề trang theo tên kho của Chủ kho đang đăng nhập.
 * Dùng chung cache `owner-vault`, nên không gọi thêm API khi trang khác đã tải kho.
 * Chưa có phiên, đang tải hoặc lỗi thì trả nhãn mặc định, không để tiêu đề trống.
 */
export function useVaultPageTitle(): VaultPageTitle {
  const isAuthenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const vault = useOwnerVault(isAuthenticated && Boolean(accessTokenMemory.get()));
  return vaultPageTitle(vault.data?.name);
}
