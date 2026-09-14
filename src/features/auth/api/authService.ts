import { createBaseService } from "@/shared/api/baseService";
import type {
  AuthSession,
  LoginRequest,
  RegisterRequest,
  PasskeyLoginRequest,
  OtpVerificationRequest,
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
   * @description Đăng xuất tài khoản
   */
  async logout(): Promise<void> {
    await axiosClient.post("/auth/logout");
  },
};
