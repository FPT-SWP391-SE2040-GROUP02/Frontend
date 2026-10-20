import type { TwoFactorChallenge } from "./twoFactor.schema";

/**
 * Thử thách 2FA chỉ sống trong RAM của tab (5 phút, dùng một lần): không Web Storage, không
 * history state, không URL. Tải lại trang là mất và người dùng đăng nhập lại.
 */
let current: { token: string; expiresAt: number } | null = null;

export const twoFactorChallengeMemory = {
  set(challenge: TwoFactorChallenge): void {
    current = {
      token: challenge.challengeToken,
      expiresAt: Date.now() + challenge.expiresIn * 1000,
    };
  },
  /** Trả token nếu còn hạn theo đồng hồ máy; BE vẫn là nơi quyết định hết hạn thật. */
  get(): string | null {
    if (!current) return null;
    if (Date.now() >= current.expiresAt) {
      current = null;
      return null;
    }
    return current.token;
  },
  clear(): void {
    current = null;
  },
};

/** Không còn thử thách hợp lệ trong RAM (hết hạn, tải lại trang): phải đăng nhập lại. */
export class TwoFactorChallengeMissingError extends Error {
  constructor() {
    super("TWO_FACTOR_CHALLENGE_MISSING");
  }
}
