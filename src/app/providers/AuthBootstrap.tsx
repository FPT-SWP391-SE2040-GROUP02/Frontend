import { useEffect, type ReactNode } from "react";
import { useAppDispatch } from "@/app/store";
import { setUser, clearCredentials } from "@/app/store/authSlice";
import { axiosClient } from "@/shared/api/axiosClient";
import type { User } from "@/entities/user";
import type { ApiResponse } from "@/shared/types";

interface AuthBootstrapProps {
  children: ReactNode;
}

/**
 * @description Khởi tạo phiên đăng nhập một lần duy nhất khi ứng dụng tải (Single Session Hydration).
 * Gọi API GET /auth/session với HttpOnly cookie để lấy thông tin người dùng và vai trò thực tế.
 */
export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      try {
        const response = await axiosClient.get<ApiResponse<{ user: User }> | { user: User } | User>("/auth/session");
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
  }, [dispatch]);

  return <>{children}</>;
}
