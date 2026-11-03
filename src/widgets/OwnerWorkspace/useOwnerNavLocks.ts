import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { useOwnerVault } from "@/features/vault-management/model/useOwnerVault";
import { ROUTES } from "@/shared/config/routes.config";
import type { NavLock } from "@/shared/ui/WorkspaceShell";

/**
 * Mục menu Chủ kho còn khóa, tính chỉ từ dữ liệu máy chủ đã xác nhận (cùng cache với wizard).
 * Query lỗi hoặc đang tải thì không khóa: chỉ khóa khi máy chủ xác nhận còn thiếu.
 * Khóa chỉ là lời nhắc, mục vẫn bấm được; Backend vẫn kiểm tra từng request.
 */
export function useOwnerNavLocks(enabled: boolean): Record<string, NavLock> {
  const vault = useOwnerVault(enabled);
  const vaultId = vault.data?.id ?? "";
  const setupQuery = usePlanSetup(vaultId);

  const setup = setupQuery.data ?? null;
  const locks: Record<string, NavLock> = {};
  if (setup !== null && setup.planStatus === "DRAFT") {
    locks[ROUTES.DMS.ROOT] = {
      reason: "Kỳ điểm danh chỉ bắt đầu sau khi bạn kích hoạt kế hoạch.",
      unlockHref: `${ROUTES.SETUP}?step=activate`,
    };
  }
  return locks;
}
