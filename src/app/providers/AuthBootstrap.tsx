import { useEffect, type ReactNode } from "react";
import { useAppDispatch } from "@/app/store";
import { setUser, clearCredentials, setHydrating } from "@/entities/user/model/authSlice";
import { axiosClient } from "@/shared/api/axiosClient";
import type { User } from "@/entities/user";
import type { ApiResponse } from "@/shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/shared/config/routes.config";

/** Cấu hình truy vấn bootstrap legacy; chưa phải contract refresh của BE. */
const SESSION_BOOTSTRAP = {
  endpoint: "/auth/session",
  queryKey: ["auth", "bootstrap"] as const,
  staleTimeMs: 5 * 60 * 1000,
};

/** Shape legacy được giữ trong nhịp giảm request; cần thay khi BE chốt DTO Auth. */
type LegacySessionResponse = ApiResponse<{ user: User }> | { user: User } | User;

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
    if (import.meta.env.DEV && Object.values(ROUTES.PREVIEW).some((path) => path === window.location.pathname)) {
      dispatch(setHydrating(false));
      return;
    }
    let isMounted = true;

    async function hydrateSession() {
      try {
        const response = await queryClient.fetchQuery({
          queryKey: SESSION_BOOTSTRAP.queryKey,
          queryFn: () => axiosClient.get<LegacySessionResponse, LegacySessionResponse>(SESSION_BOOTSTRAP.endpoint),
          staleTime: SESSION_BOOTSTRAP.staleTimeMs,
          retry: false,
        });
        if (!isMounted) return;

        let user: User | null = null;
        if (response && typeof response === "object") {
          if ("data" in response && response.data && typeof response.data === "object" && "user" in response.data) {
            user = (response.data as { user: User }).user;
          } else if ("user" in response && (response as { user: User }).user) {
            user = (response as { user: User }).user;
          } else if ("id" in response && "email" in response) {
            user = response as unknown as User;
          }
        }

        if (user) {
          dispatch(setUser(user));
        } else {
          dispatch(clearCredentials());
        }
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
