import { APP_MESSAGES } from "@/shared/constants";
import { ROUTES } from "./routes.config";

/** @description Chỉ các route preview được khai báo mới được đọc fixture trong development. */
export function isPreviewWorkspace(): boolean {
  return (
    import.meta.env.DEV &&
    Object.values(ROUTES.PREVIEW).some((path) => path === window.location.pathname)
  );
}

/** @description Chặn service fixture trong luồng thật cho đến khi contract BE được tích hợp. */
export function requirePreviewWorkspace(): void {
  if (!isPreviewWorkspace()) throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}
