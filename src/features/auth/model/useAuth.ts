import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../api/authService";
import type {
  LoginRequest,
  RegisterRequest,
  PasskeyLoginRequest,
  AuthSession,
  LinkGoogleRequest,
  TwoFactorVerifyRequest,
  LogoutOptions,
} from "./auth.types";
import { useDispatch as useAppDispatch } from "react-redux";
import { setCredentials, clearCredentials } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";

export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
};

/**
 * @description Hook xử lý Đăng nhập tài khoản bằng React Query useMutation.
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (session: AuthSession) => {
      // Cập nhật Redux Session State (cookie HttpOnly do Backend quản lý tự động)
      if (session?.user) {
        dispatch(setCredentials({ user: session.user }));
      }
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
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (payload: PasskeyLoginRequest) => authService.loginWithPasskey(payload),
    onSuccess: (session: AuthSession) => {
      if (session?.user) {
        dispatch(setCredentials({ user: session.user }));
      }
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

/**
 * @description Hook xử lý xác nhận mật khẩu để liên kết tài khoản Google (Mockup 5).
 */
export function useLinkGoogle() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (payload: LinkGoogleRequest) => authService.linkGoogleAccount(payload),
    onSuccess: (session: AuthSession) => {
      if (session?.user) {
        dispatch(setCredentials({ user: session.user }));
      }
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

/**
 * @description Hook xử lý xác thực hai bước TOTP cho tài khoản quản trị (Mockup 7).
 */
export function useTwoFactorVerify() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (payload: TwoFactorVerifyRequest) => authService.verifyTwoFactor(payload),
    onSuccess: (session: AuthSession) => {
      if (session?.user) {
        dispatch(setCredentials({ user: session.user }));
      }
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

/**
 * @description Hook gửi lại email xác minh (Mockup 6).
 */
export function useResendEmailVerification() {
  return useMutation({
    mutationFn: (email: string) => authService.resendVerificationEmail(email),
  });
}

/**
 * @description Hook đăng xuất tài khoản an toàn (Mockup 8).
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (options?: LogoutOptions) => authService.logout(options),
    onSuccess: () => {
      accessTokenMemory.clear();
      dispatch(clearCredentials());
      queryClient.clear();
    },
  });
}
