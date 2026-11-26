import { VAULT_PLAN_STATUS } from "./vault.types";

/**
 * Lý do kho đang bị khóa với Chủ tài sản, theo trạng thái kế hoạch. Khớp VaultRules.GetNotEditableReason của Backend:
 * từ lúc người nhận gửi yêu cầu nhận tài sản thì mọi thao tác thay đổi kho đều bị từ chối.
 */
const LOCK_REASONS: Record<string, string> = {
  [VAULT_PLAN_STATUS.HANDOVER_REQUESTED]:
    "Có người nhận gửi yêu cầu nhận tài sản nên tài sản đang bị khóa trong lúc luật sư xét giấy tờ và lập biên bản.",
  [VAULT_PLAN_STATUS.HANDOVER_IN_PROGRESS]:
    "Kế hoạch đang bàn giao nên tài sản không thay đổi được.",
  [VAULT_PLAN_STATUS.CLOSED]: "Kế hoạch đã đóng nên tài sản không thay đổi được.",
};

/** Chỉ cần hai trường này của kho; nhận null khi kho chưa tải để caller không phải kiểm tra trước. */
interface VaultLockInput {
  status: string;
  planStatus: string;
}

/**
 * Lý do khóa dùng để hiện cho người dùng, hoặc null khi kho còn sửa được.
 * Trạng thái lạ chưa biết thì không coi là khóa: Backend vẫn là nơi chặn cuối cùng.
 */
export function getVaultLockReason(vault: VaultLockInput | null | undefined): string | null {
  if (!vault) {
    return null;
  }
  if (vault.status === "CLOSED") {
    return "Tài sản đã đóng nên không thay đổi được.";
  }
  if (Object.hasOwn(LOCK_REASONS, vault.planStatus)) {
    return LOCK_REASONS[vault.planStatus];
  }
  return null;
}
