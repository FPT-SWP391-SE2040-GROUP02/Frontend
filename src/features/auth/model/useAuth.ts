import { clearCredentials, setCredentials } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch as useAppDispatch } from "react-redux";
import { authService, cookieAuthService } from "../api/authService";
import { toAuthUserViewModel } from "@/entities/user/lib/adapters";
import type { AuthSessionDto } from "@/entities/user/model/authContract.types";
import type {
  AuthSession,
  LinkGoogleRequest,
  LoginRequest,
  LogoutOptions,
  PasskeyLoginRequest,
  RegisterRequest,
  TwoFactorVerifyRequest,
} from "./auth.types";

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
    mutationFn: (credentials: LoginRequest) =>
      cookieAuthService.login({ ...credentials, rememberMe: credentials.rememberMe ?? false }),
    onSuccess: (session: AuthSessionDto) => {
      accessTokenMemory.clear();
      dispatch(setCredentials({ user: toAuthUserViewModel(session.user) }));
      queryClient.setQueryData(authKeys.session(), { user: session.user });
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
 * @description Gửi lại email xác minh; trả lỗi khi mất mạng để người dùng chủ động thử lại.
 */
export function useResendEmailVerification() {
  return useMutation({
    mutationFn: (email: string) => authService.resendVerificationEmail(email),
    networkMode: "always",
    retry: false,
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
