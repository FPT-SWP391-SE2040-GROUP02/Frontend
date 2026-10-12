import { useEffect, type ReactNode } from "react";
import { useAppDispatch } from "@/app/store";
import { setUser, clearCredentials, setHydrating } from "@/entities/user/model/authSlice";
import { cookieAuthService } from "@/features/auth/api/authService";
import { authKeys } from "@/features/auth/model/useAuth";
import { toAuthUserViewModel } from "@/entities/user/lib/adapters";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/shared/config/routes.config";

/** Session cache lifetime shared with the cookie authentication query. */
const SESSION_BOOTSTRAP = {
  staleTimeMs: 5 * 60 * 1000,
};

/** Application content rendered after session hydration starts. */
interface AuthBootstrapProps {
  children: ReactNode;
}

/**
 * @description Khởi tạo phiên đăng nhập một lần duy nhất khi ứng dụng tải (Single Session Hydration).
 * Gọi API GET /auth/session với HttpOnly cookie để lấy thông tin người dùng và vai trò thực tế.
 */
export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      Object.values(ROUTES.PREVIEW).some((path) => path === window.location.pathname)
    ) {
      dispatch(setHydrating(false));
      return;
    }
    let isMounted = true;

    /** Restore the validated cookie session without retrying authentication failures. */
    async function hydrateSession() {
      try {
        const response = await queryClient.fetchQuery({
          queryKey: authKeys.session(),
          queryFn: cookieAuthService.getSession,
          staleTime: SESSION_BOOTSTRAP.staleTimeMs,
          retry: false,
        });
        if (!isMounted) return;

        dispatch(setUser(toAuthUserViewModel(response.user)));
      } catch {
        if (isMounted) {
          dispatch(clearCredentials());
        }
      }
    }

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, [dispatch, queryClient]);

  return <>{children}</>;
}
