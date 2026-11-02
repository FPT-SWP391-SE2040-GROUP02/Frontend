import { useSelector } from "react-redux";
import { ROUTES } from "@/shared/config/routes.config";
import { WIZARD_ENABLED } from "@/shared/config/wizard.config";
import { ROLES } from "@/shared/constants/roles";
import type { AuthState } from "./authSlice";

/** Trang chính dựa trên phiên và role Backend; không đọc UI role hay thay đổi credential/cache. */
export function useAccountHome(): string {
  return useSelector((state: { auth: AuthState }) => {
    if (!state.auth.isAuthenticated) return ROUTES.HOME;
    if (state.auth.user?.role === ROLES.ADMIN) return ROUTES.ADMIN.ROOT;
    if (state.auth.user?.role === ROLES.VERIFIER) {
      if (WIZARD_ENABLED.verifier) return ROUTES.NOTARY.STEPS;
      return ROUTES.NOTARY.WORKSPACE;
    }
    if (state.auth.user?.role === ROLES.EXECUTOR) return ROUTES.EXECUTOR.ROOT;
    return ROUTES.DASHBOARD.ROOT;
  });
}
