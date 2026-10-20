import { APP_MESSAGES } from "@/shared/constants";
import {
  googleLoginRequestSchema,
  googleLinkRequestSchema,
  googleLoginResponseSchema,
} from "../model/googleAuth.schema";
import type {
  AuthSession,
  RegisterRequest,
  PasskeyLoginRequest,
  OtpVerificationRequest,
  LinkGoogleRequest,
  TwoFactorVerifyRequest,
} from "../model/auth.types";
import { backendUserResponseSchema } from "@/entities/user/model/backendUser.schema";
import { emailVerificationTokenSchema } from "../model/verifyEmail.schema";
import {
  loginOutcomeSchema,
  twoFactorVerifyRequestSchema,
  type TwoFactorChallenge,
} from "../model/twoFactor.schema";
import { axiosClient } from "@/shared/api/axiosClient";
import {
  authCsrfTokenResponseSchema,
  authSessionResponseSchema,
  currentSessionResponseSchema,
} from "@/entities/user/model/authContract.schema";
import type {
  AuthLoginRequestDto,
  AuthLogoutRequestDto,
  AuthSessionDto,
  CurrentSessionDto,
} from "@/entities/user/model/authContract.types";

/** Endpoints từ Backend/AuthController tại commit 838ebe1. */
const COOKIE_AUTH_ENDPOINTS = {
  CSRF: "/auth/csrf",
  LOGIN: "/auth/login",
  REFRESH: "/auth/refresh",
  SESSION: "/auth/session",
  LOGOUT: "/auth/logout",
} as const;

/** Header configured by the backend AuthCsrfContract. */
const CSRF_HEADER = "X-CSRF-Token";

/** Acquires fresh identity-bound proof in local RAM; acquisition failure blocks the POST. */
async function getCsrfConfig(): Promise<{ headers: Record<string, string> }> {
  const body = await axiosClient.get<unknown, unknown>(COOKIE_AUTH_ENDPOINTS.CSRF);
  const { requestToken } = authCsrfTokenResponseSchema.parse(body);
  return { headers: { [CSRF_HEADER]: requestToken } };
}

/** Transport Bearer RAM + refresh cookie; caller phối hợp auth transitions. */
export const sessionAuthService = {
  /**
   * Posts only the C# login fields; validates the full body before unwrapping data.
   * Admin đã bật 2FA nhận thử thách thay cho phiên (chưa có cookie).
   */
  async login(request: AuthLoginRequestDto): Promise<AuthSessionDto | TwoFactorChallenge> {
    const config = await getCsrfConfig();
    const body = await axiosClient.post<unknown, unknown>(
      COOKIE_AUTH_ENDPOINTS.LOGIN,
      { email: request.email, password: request.password, rememberMe: request.rememberMe },
      config,
    );
    return loginOutcomeSchema.parse(body);
  },

  /** Xoay refresh cookie HttpOnly và nhận access token raw; chỉ giữ token trong RAM. */
  async refresh(): Promise<AuthSessionDto> {
    const config = await getCsrfConfig();
    const body = await axiosClient.post<unknown, unknown>(
      COOKIE_AUTH_ENDPOINTS.REFRESH,
      undefined,
      config,
    );
    return authSessionResponseSchema.parse(body);
  },

  /** Đọc raw UserResponse bằng Bearer từ shared RAM interceptor. */
  async getSession(): Promise<CurrentSessionDto> {
    const body = await axiosClient.get<unknown, unknown>(COOKIE_AUTH_ENDPOINTS.SESSION);
    return currentSessionResponseSchema.parse(body);
  },

  /** Sends only the confirmed optional logout body; the backend clears HttpOnly cookies. */
  async logout(request?: AuthLogoutRequestDto): Promise<void> {
    const config = await getCsrfConfig();
    await axiosClient.post<unknown, unknown>(
      COOKIE_AUTH_ENDPOINTS.LOGOUT,
      request === undefined ? undefined : { revokeAllDevices: request.revokeAllDevices },
      config,
    );
  },
};

/**
 * @description Dịch vụ gọi API xác thực và phân quyền (Authentication API Service).
 */
export const authService = {
  /**
   * @description Đăng ký theo DTO Backend; 202 không body chỉ xác nhận tiếp nhận, chưa cấp phiên.
   * @param data Bốn trường của RegisterRequest C#; không gửi role/phone từ client.
   * @returns Promise hoàn thành khi HTTP thành công; lỗi giữ nguyên để UI xử lý.
   */
  async register(data: RegisterRequest): Promise<void> {
    await axiosClient.post<unknown, unknown>("/auth/register", {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      fullName: data.fullName,
    });
  },

  /**
   * @description Contract xác minh token; response là UserResponse công khai, không phải session.
   * @param token Token opaque từ liên kết email; giữ nguyên bytes và không ghi log/storage.
   * @returns User đã validate; không tự đăng nhập hoặc cấp quyền từ kết quả này.
   */
  async verifyEmail(token: string) {
    const requestToken = emailVerificationTokenSchema.parse(token);
    const body = await axiosClient.post<unknown, unknown>("/auth/verify-email", {
      token: requestToken,
    });
    return backendUserResponseSchema.parse(body);
  },

  /**
   * @description Đăng nhập nhanh bằng WebAuthn / Passkey FIDO2
   * @param {PasskeyLoginRequest} payload Dữ liệu xác thực sinh trắc học
   * @returns {Promise<AuthSession>}
   */
  async loginWithPasskey(_payload: PasskeyLoginRequest): Promise<AuthSession> {
    throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
  },

  /**
   * @description Xác thực mã OTP
   * @param {OtpVerificationRequest} payload
   */
  async verifyOtp(_payload: OtpVerificationRequest): Promise<boolean> {
    throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
  },

  /**
   * @description Xác nhận mật khẩu để liên kết tài khoản Google (Mockup 5)
   * @param {LinkGoogleRequest} payload Thông tin email và mật khẩu hiện có
   * @returns {Promise<AuthSession>} Phiên đăng nhập sau khi liên kết thành công
   */
  async linkGoogleAccount(payload: LinkGoogleRequest): Promise<AuthSession | TwoFactorChallenge> {
    const request = googleLinkRequestSchema.parse(payload);
    const config = await getCsrfConfig();
    const body = await axiosClient.post<unknown, unknown>(
      "/auth/google/link-confirm",
      request,
      config,
    );
    return loginOutcomeSchema.parse(body);
  },

  /** Google ID token được Backend xác minh; không nhận email/profile thay cho token. */
  async loginWithGoogle(payload: {
    idToken: string;
    nonce?: string;
    rememberMe: boolean;
    returnUrl?: string;
  }) {
    const request = googleLoginRequestSchema.parse(payload);
    const config = await getCsrfConfig();
    const body = await axiosClient.post<unknown, unknown>("/auth/google", request, config);
    return googleLoginResponseSchema.parse(body);
  },

  /**
   * @description Hoàn tất đăng nhập Admin bằng mã TOTP hoặc mã khôi phục (BE mục 6.2a).
   * @param {TwoFactorVerifyRequest} payload Token thử thách từ RAM và mã người dùng nhập
   * @returns {Promise<AuthSession>} Phiên đầy đủ; BE đặt cookie lv_refresh
   */
  async verifyTwoFactor(payload: TwoFactorVerifyRequest): Promise<AuthSession> {
    const request = twoFactorVerifyRequestSchema.parse({
      challengeToken: payload.challengeToken,
      code: payload.code.trim(),
    });
    const config = await getCsrfConfig();
    const body = await axiosClient.post<unknown, unknown>("/auth/2fa/verify", request, config);
    return authSessionResponseSchema.parse(body);
  },

  /**
   * @description Gửi yêu cầu theo Backend AuthController; 202 không có body chỉ xác nhận tiếp nhận.
   * @param email Địa chỉ nhận liên kết xác minh.
   * @returns Promise hoàn thành khi HTTP thành công; không chứng minh email đã được giao.
   */
  async resendVerificationEmail(email: string): Promise<void> {
    await axiosClient.post<unknown, unknown>("/auth/resend-verification", { email });
  },
};
