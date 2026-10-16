import { clearCredentials, setCredentials } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch as useAppDispatch } from "react-redux";
import { authService, sessionAuthService } from "../api/authService";
import { runAuthTransition, notifyAuthChange } from "./authTransitions";
import { toAuthUserViewModel } from "@/entities/user/lib/adapters";
import type { AuthSessionDto } from "@/entities/user/model/authContract.types";
import type { z } from "zod";
import type { googleLoginRequestSchema } from "./googleAuth.schema";
import type {
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
      runAuthTransition(
        () =>
          sessionAuthService.login({ ...credentials, rememberMe: credentials.rememberMe ?? false }),
        async (session: AuthSessionDto, current) => {
          await queryClient.cancelQueries();
          if (!current()) throw new Error("Auth context changed");
          queryClient.clear();
          accessTokenMemory.set(session.accessToken);
          dispatch(setCredentials({ user: toAuthUserViewModel(session.user) }));
          queryClient.setQueryData(authKeys.session(), { user: session.user });
          notifyAuthChange();
        },
      ).then((session) => ({ user: session.user })),
    retry: false,
    networkMode: "always",
  });
}

/** Google challenge không cấp phiên; chỉ publish và giữ public user sau signedIn=true. */
export function useGoogleLogin() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  return useMutation({
    gcTime: 0,
    mutationFn: (payload: z.infer<typeof googleLoginRequestSchema>) =>
      runAuthTransition(
        () => authService.loginWithGoogle(payload),
        async (result, current) => {
          if (!result.signedIn) return;
          await queryClient.cancelQueries();
          if (!current()) throw new Error("Auth context changed");
          queryClient.clear();
          accessTokenMemory.set(result.session.accessToken);
          dispatch(setCredentials({ user: toAuthUserViewModel(result.session.user) }));
          queryClient.setQueryData(authKeys.session(), { user: result.session.user });
          notifyAuthChange();
        },
      ).then((result) =>
        result.signedIn ? { signedIn: true as const, user: result.session.user } : result,
      ),
    retry: false,
    networkMode: "always",
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
  return useMutation({
    mutationFn: (payload: PasskeyLoginRequest) => authService.loginWithPasskey(payload),
    retry: false,
  });
}

/**
 * @description Hook xử lý xác nhận mật khẩu để liên kết tài khoản Google (Mockup 5).
 */
export function useLinkGoogle() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  return useMutation({
    gcTime: 0,
    mutationFn: (payload: LinkGoogleRequest) =>
      runAuthTransition(
        () => authService.linkGoogleAccount(payload),
        async (session, current) => {
          await queryClient.cancelQueries();
          if (!current()) throw new Error("Auth context changed");
          queryClient.clear();
          accessTokenMemory.set(session.accessToken);
          dispatch(setCredentials({ user: toAuthUserViewModel(session.user) }));
          queryClient.setQueryData(authKeys.session(), { user: session.user });
          notifyAuthChange();
        },
      ).then((session) => ({ user: session.user })),
    retry: false,
    networkMode: "always",
  });
}

/**
 * @description Hook xử lý xác thực hai bước TOTP cho tài khoản quản trị (Mockup 7).
 */
export function useTwoFactorVerify() {
  const mutation = useMutation({
    mutationFn: (payload: TwoFactorVerifyRequest) => authService.verifyTwoFactor(payload),
    retry: false,
  });
  return { ...mutation, isAvailable: false };
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
    mutationFn: (options?: LogoutOptions) =>
      runAuthTransition(
        () =>
          sessionAuthService.logout(
            options === undefined
              ? undefined
              : { revokeAllDevices: options.revokeAllDevices ?? false },
          ),
        async (_, current) => {
          await queryClient.cancelQueries();
          if (!current()) throw new Error("Auth context changed");
          accessTokenMemory.clear();
          dispatch(clearCredentials());
          queryClient.clear();
          notifyAuthChange();
        },
      ),
    retry: false,
    networkMode: "always",
  });
}
