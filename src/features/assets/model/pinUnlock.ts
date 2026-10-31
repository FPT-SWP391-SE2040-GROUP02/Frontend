import { accessTokenMemory } from "@/shared/api/accessToken";

/** Nhập đúng PIN thì thông tin mục hiện trong khoảng này; hết thì che lại và phải nhập lại PIN. */
export const REVEAL_DURATION_MS = 3 * 60 * 1000;

interface Unlock {
  /** PIN đã kiểm (trống khi kho chưa cần PIN), gửi kèm khi lưu sửa đổi. Chỉ nằm trong RAM. */
  pin?: string;
  /** Mở khóa thuộc đúng phiên đăng nhập này; đổi tài khoản hay đăng xuất thì không còn hiệu lực. */
  credential: string;
  expiresAt: number;
}

const unlocks = new Map<string, Unlock>();

/**
 * Lần mở khóa PIN gần nhất của kho, dùng chung giữa danh sách mục và trang chi tiết để không hỏi PIN hai lần.
 * Không ghi vào storage; tải lại trang là mất. Trả null khi chưa mở, đã hết hạn hoặc đã đổi phiên.
 */
export function readPinUnlock(vaultId: string): { pin?: string; expiresAt: number } | null {
  const unlock = unlocks.get(vaultId);
  if (!unlock) return null;
  if (unlock.credential !== accessTokenMemory.get() || Date.now() >= unlock.expiresAt) {
    unlocks.delete(vaultId);
    return null;
  }
  return { pin: unlock.pin, expiresAt: unlock.expiresAt };
}

export function rememberPinUnlock(vaultId: string, pin: string | undefined) {
  const credential = accessTokenMemory.get();
  if (!credential) return;
  unlocks.set(vaultId, { pin, credential, expiresAt: Date.now() + REVEAL_DURATION_MS });
}

export function forgetPinUnlock(vaultId: string) {
  unlocks.delete(vaultId);
}
