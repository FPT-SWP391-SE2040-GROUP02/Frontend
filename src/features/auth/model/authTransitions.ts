import { accessTokenMemory } from "@/shared/api/accessToken";

let pending: Promise<unknown> = Promise.resolve();
let revision = 0;
/** Kênh chỉ gửi invalidation, tuyệt đối không gửi tokens/user data. */
export const AUTH_TAB_ID = crypto.randomUUID();
export const AUTH_CHANGE_CHANNEL = "legacyvault-auth-change";

/** Cross-tab lock cần thiết trước khi tự xoay shared refresh cookie khi reload. */
export function canRestoreSession(): boolean {
  return typeof navigator !== "undefined" && navigator.locks !== undefined;
}

/** Vô hiệu phản hồi cũ khi tab khác đổi danh tính; không chứng minh HTTP/Set-Cookie đã dừng. */
export function invalidateAuthSession(): void {
  revision++;
  accessTokenMemory.clear();
}

/** Thông báo tab khác đóng context riêng tư; không publish credentials. */
export function notifyAuthChange(): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(AUTH_CHANGE_CHANNEL);
  channel.postMessage({ type: "invalidate", sender: AUTH_TAB_ID });
  channel.close();
}

/**
 * Serialize cookie mutations cùng publication trong tab; Web Locks phối hợp cùng origin.
 * Failure không kẹt queue hoặc retry mutation. Commit phải check current sau mỗi await.
 */
export function runAuthTransition<T>(
  operation: () => Promise<T>,
  commit: (result: T, current: () => boolean) => Promise<void> | void,
): Promise<T> {
  const execute = async () => {
    const generation = revision;
    const current = () => revision === generation;
    const result = await operation();
    if (!current()) throw new Error("Auth context changed");
    await commit(result, current);
    return result;
  };
  const run = () =>
    canRestoreSession() ? navigator.locks.request("legacyvault-auth-cookie", execute) : execute();
  const result = pending.then(run, run);
  pending = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
