/** Access token hiện tại chỉ tồn tại trong bộ nhớ của module; reload sẽ xóa. */
let currentAccessToken: string | null = null;

/**
 * @description Bộ nhớ token cho shared transport; không đọc/ghi Web Storage hoặc cookie.
 * Caller Auth chịu trách nhiệm validate credential và xóa khi kết thúc phiên.
 * @example accessTokenMemory.set(validatedCredentials.accessToken);
 */
export const accessTokenMemory = {
  /** @returns Access token hiện tại hoặc null nếu chưa có phiên. */
  get(): string | null {
    return currentAccessToken;
  },
  /** @param token Access token đã được Auth validate; không truyền refresh token. */
  set(token: string): void {
    currentAccessToken = token;
  },
  /** Xóa tham chiếu token khi đăng xuất hoặc phiên không thể khôi phục. */
  clear(): void {
    currentAccessToken = null;
  },
};
