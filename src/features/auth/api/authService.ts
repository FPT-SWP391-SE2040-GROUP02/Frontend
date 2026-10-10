import { createBaseService } from "@/shared/api/baseService";
import type {
  AuthSession,
  LoginRequest,
  RegisterRequest,
  PasskeyLoginRequest,
  OtpVerificationRequest,
  LinkGoogleRequest,
  TwoFactorVerifyRequest,
  LogoutOptions,
} from "../model/auth.types";
import { axiosClient } from "@/shared/api/axiosClient";

const baseAuthService = createBaseService<AuthSession>({
  endpoint: "/auth",
});

/**
 * @description Dịch vụ gọi API xác thực và phân quyền (Authentication API Service).
 */
export const authService = {
  ...baseAuthService,

  /**
   * @description Đăng nhập bằng Email và Password
   * @param {LoginRequest} credentials Thông tin đăng nhập
   * @returns {Promise<AuthSession>} Thông tin phiên đăng nhập
   */
  async login(credentials: LoginRequest): Promise<AuthSession> {
    const response = await axiosClient.post<AuthSession>("/auth/login", credentials);
    return response.data;
  },

  /**
   * @description Đăng ký tài khoản người dùng mới
   * @param {RegisterRequest} data Thông tin đăng ký
   * @returns {Promise<AuthSession>} Kết quả phiên đăng ký
   */
  async register(data: RegisterRequest): Promise<AuthSession> {
    const response = await axiosClient.post<AuthSession>("/auth/register", data);
    return response.data;
  },

  /**
   * @description Đăng nhập nhanh bằng WebAuthn / Passkey FIDO2
   * @param {PasskeyLoginRequest} payload Dữ liệu xác thực sinh trắc học
   * @returns {Promise<AuthSession>}
   */
  async loginWithPasskey(payload: PasskeyLoginRequest): Promise<AuthSession> {
    const response = await axiosClient.post<AuthSession>("/auth/passkey/verify", payload);
    return response.data;
  },

  /**
   * @description Xác thực mã OTP
   * @param {OtpVerificationRequest} payload
   */
  async verifyOtp(payload: OtpVerificationRequest): Promise<boolean> {
    const response = await axiosClient.post<{ isValid: boolean }>("/auth/otp/verify", payload);
    return response.data.isValid;
  },

  /**
   * @description Xác nhận mật khẩu để liên kết tài khoản Google (Mockup 5)
   * @param {LinkGoogleRequest} payload Thông tin email và mật khẩu hiện có
   * @returns {Promise<AuthSession>} Phiên đăng nhập sau khi liên kết thành công
   */
  async linkGoogleAccount(payload: LinkGoogleRequest): Promise<AuthSession> {
    const response = await axiosClient.post<AuthSession>("/auth/google/link-account", payload);
    return response.data;
  },

  /**
   * @description Xác thực hai bước TOTP cho tài khoản quản trị (Mockup 7)
   * @param {TwoFactorVerifyRequest} payload Mã 6 số và cờ ghi nhớ thiết bị
   * @returns {Promise<AuthSession>} Phiên đăng nhập hoàn chỉnh
   */
  async verifyTwoFactor(payload: TwoFactorVerifyRequest): Promise<AuthSession> {
    const response = await axiosClient.post<AuthSession>("/auth/2fa/verify-totp", payload);
    return response.data;
  },

  /**
   * @description Gửi lại email xác minh tài khoản (Mockup 6)
   * @param {string} email Địa chỉ email cần gửi lại liên kết
   * @returns {Promise<{ success: boolean }>}
   */
  async resendVerificationEmail(email: string): Promise<{ success: boolean }> {
    const response = await axiosClient.post<{ success: boolean }>(
      "/auth/email/resend-verification",
      { email },
    );
    return response.data;
  },

  /**
   * @description Đăng xuất tài khoản người dùng và hủy phiên làm việc (Mockup 8)
   * @param {LogoutOptions} [options] Tùy chọn đăng xuất khỏi mọi thiết bị
   */
  async logout(options?: LogoutOptions): Promise<void> {
    await axiosClient.post("/auth/logout", options);
  },
};
