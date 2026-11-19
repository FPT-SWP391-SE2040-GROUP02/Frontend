import { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { accessTokenMemory } from "./accessToken";

declare module "axios" {
  interface AxiosRequestConfig {
    /** true khi request đã được gửi lại một lần sau khi làm mới phiên: không làm mới và gửi lại lần hai. */
    sessionRefreshed?: boolean;
  }
}

/** ok: đã có access token mới trong RAM. expired: phiên không khôi phục được. unavailable: lỗi tạm (mạng, 5xx). */
export type SessionRefreshOutcome = "ok" | "expired" | "unavailable";
type Refresher = () => Promise<SessionRefreshOutcome>;

let refresher: Refresher | null = null;
let inFlight: Promise<SessionRefreshOutcome> | null = null;

/**
 * App sở hữu cookie refresh và khóa liên tab nên đăng ký hàm làm mới ở đây (shared không import feature/app, giống
 * subscribeSessionFailure). Trả hàm gỡ đăng ký.
 */
export function registerSessionRefresher(next: Refresher): () => void {
  refresher = next;
  return () => {
    if (refresher === next) refresher = null;
  };
}

export type SessionRefreshResult =
  { handled: true; value: unknown } | { handled: false; transient: boolean };

const NOT_HANDLED: SessionRefreshResult = { handled: false, transient: false };

/**
 * Access token hết hạn giữa phiên (401 SESSION_EXPIRED): làm mới một lần rồi gửi lại đúng request đó, để người dùng
 * không bị đăng xuất khi refresh cookie còn hạn. Nhiều request cùng hết hạn chỉ dùng chung một lần làm mới (Backend
 * cấm gọi refresh song song). Không có hàm làm mới, request thuộc /auth/ (trừ /auth/session) hoặc đã gửi lại một lần
 * thì trả handled=false để lỗi gốc đi tiếp như cũ. Làm mới thất bại vì lỗi tạm thì transient=true: không đóng phiên.
 */
export async function resolveSessionExpiry(
  error: AxiosError,
  retry: (config: InternalAxiosRequestConfig) => Promise<unknown>,
): Promise<SessionRefreshResult> {
  const config = error.config;
  const active = refresher;
  if (!config || !active || config.sessionRefreshed === true) return NOT_HANDLED;
  const body: unknown = error.response?.data;
  if (
    error.response?.status !== 401 ||
    typeof body !== "object" ||
    body === null ||
    !("code" in body) ||
    body.code !== "SESSION_EXPIRED"
  ) {
    return NOT_HANDLED;
  }
  const url = config.url ?? "";
  if (url.includes("/auth/") && !url.includes("/auth/session")) return NOT_HANDLED;
  const token = accessTokenMemory.get();
  if (!token) return NOT_HANDLED;

  // 401 đến muộn của token cũ đã được thay: chỉ cần gửi lại bằng token hiện tại, không làm mới thêm.
  if (config.headers.get("Authorization") === `Bearer ${token}`) {
    inFlight ??= active().finally(() => {
      inFlight = null;
    });
    const outcome = await inFlight;
    if (outcome !== "ok") return { handled: false, transient: outcome === "unavailable" };
  }
  config.sessionRefreshed = true;
  return { handled: true, value: await retry(config) };
}
