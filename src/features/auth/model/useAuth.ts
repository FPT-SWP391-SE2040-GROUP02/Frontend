import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../api/authService";
import type { LoginRequest, RegisterRequest, PasskeyLoginRequest, AuthSession } from "./auth.types";
import { storage } from "@/shared/utils";

export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
};

/**
 * @description Hook xử lý Đăng nhập tài khoản bằng React Query useMutation.
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (session: AuthSession) => {
      // TODO: 1. Lưu session token vào localStorage
      if (session?.accessToken) {
        storage.setToken(session.accessToken);
      }
      // TODO: 2. Invalidate cache auth
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

/**
 * @description Hook xử lý Đăng ký tài khoản mới.
 */
export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
  });
}

/**
 * @description Hook xử lý Đăng nhập bằng Passkey sinh trắc học FIDO2.
 */
export function usePasskeyLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PasskeyLoginRequest) => authService.loginWithPasskey(payload),
    onSuccess: (session: AuthSession) => {
      if (session?.accessToken) {
        storage.setToken(session.accessToken);
      }
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}
