import { type AxiosError } from "axios";
import { accessTokenMemory } from "./accessToken";

const listeners = new Set<() => void>();
/** App sở hữu Redux/cache cleanup; shared transport không import feature/app. */
export function subscribeSessionFailure(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
/** Chỉ đóng phiên hiện tại: bỏ qua 401 đến muộn của access token cũ và các Auth POST. */
export function reportSessionFailure(error: AxiosError): void {
  const body: unknown = error.response?.data;
  if (
    error.response?.status !== 401 ||
    typeof body !== "object" ||
    body === null ||
    !("code" in body) ||
    body.code !== "SESSION_EXPIRED"
  )
    return;
  const token = accessTokenMemory.get();
  if (!token || error.config?.headers.get("Authorization") !== `Bearer ${token}`) return;
  if (error.config.url?.includes("/auth/")) return;
  for (const listener of listeners) listener();
}
