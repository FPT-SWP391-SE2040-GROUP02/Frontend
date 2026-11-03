import type { QueryClient } from "@tanstack/react-query";
import { ownerVaultKeys } from "./useOwnerVault";

/** Làm mới mọi dữ liệu bị ảnh hưởng khi gói, tài sản trong gói hoặc người nhận của gói thay đổi. */
export function invalidateGroupQueries(client: QueryClient, vaultId: string): void {
  void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
  void client.invalidateQueries({ queryKey: ["vault-assets", vaultId] });
  void client.invalidateQueries({ queryKey: ["vault-beneficiaries", vaultId] });
  void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
}
