import { useEffect, useEffectEvent, useState } from "react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import type { VaultPinConfirmation } from "@/shared/api/vaultPin";
import { forgetPinUnlock, readPinUnlock, rememberPinUnlock } from "./pinUnlock";

/**
 * Trạng thái "đã nhập PIN" của kho cho danh sách mục và trang chi tiết. Mở khóa ở một nơi thì nơi kia dùng lại
 * (pinUnlock.ts). Tự khóa khi hết REVEAL_DURATION_MS hoặc chuyển tab; `keepOpen` tạm giữ lại (ví dụ đang sửa dở).
 */
export function useVaultPinUnlock(
  vaultId: string,
  confirmPin: () => Promise<VaultPinConfirmation>,
  keepOpen = false,
) {
  const [unlock, setUnlock] = useState(() => readPinUnlock(vaultId));
  const action = usePrivateAction();

  /**
   * Hỏi PIN (hoặc dùng lần mở khóa còn hạn). `onCancel` chạy khi người dùng hủy hộp thoại PIN, `onUnlocked` chạy
   * với PIN đã kiểm khi mở khóa xong (ví dụ để mở form sửa).
   */
  const request = (onCancel?: () => void, onUnlocked?: (pin: string | undefined) => void) => {
    const existing = readPinUnlock(vaultId);
    if (existing) {
      setUnlock(existing);
      if (onUnlocked) onUnlocked(existing.pin);
      return;
    }
    void action.execute(confirmPin, (result) => {
      if (!result.confirmed) {
        if (onCancel) onCancel();
        return;
      }
      rememberPinUnlock(vaultId, result.pin);
      setUnlock(readPinUnlock(vaultId));
      if (onUnlocked) onUnlocked(result.pin);
    });
  };

  const lock = () => {
    forgetPinUnlock(vaultId);
    setUnlock(null);
  };

  const lockFromEffect = useEffectEvent(lock);
  useEffect(() => {
    if (!unlock || keepOpen) return;
    const timer = window.setTimeout(lockFromEffect, Math.max(0, unlock.expiresAt - Date.now()));
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") lockFromEffect();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [unlock, keepOpen]);

  return {
    unlocked: unlock !== null,
    pin: unlock ? unlock.pin : undefined,
    request,
    lock,
    pending: action.pending,
    error: action.error,
  };
}
