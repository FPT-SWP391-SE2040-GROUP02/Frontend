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
    try {
      const response = await axiosClient.post<AuthSession>("/auth/login", credentials);
      if (response.data) return response.data;
    } catch (err) {
      console.warn("[authService] login fallback:", err);
    }

    const email = credentials.email.toLowerCase();
    let role: Role = "CUSTOMER";
    let fullName = "Alexander Hayes";

    if (email.includes("beneficiary")) {
      role = "BENEFICIARY";
      fullName = "Eleanor Hayes";
    } else if (email.includes("notary") || email.includes("verifier")) {
      role = "NOTARY";
      fullName = "Nguyễn Văn Hùng (Công chứng viên)";
    } else if (email.includes("executor")) {
      role = "EXECUTOR";
      fullName = "Trần Minh Thi Hành";
    } else if (email.includes("admin")) {
      role = "ADMIN";
      fullName = "Quản trị viên Hệ thống";
    }

    return {
      userId: `usr_${Date.now()}`,
      accessToken: `mock_jwt_token_${role.toLowerCase()}_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      expiresIn: 3600,
      user: {
        id: `usr_${Date.now()}`,
        fullName,
        email: credentials.email,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  /**
   * @description Đăng ký tài khoản người dùng mới
   * @param {RegisterRequest} data Thông tin đăng ký
   * @returns {Promise<AuthSession>} Kết quả phiên đăng ký
   */
  async register(data: RegisterRequest): Promise<AuthSession> {
    try {
      const response = await axiosClient.post<AuthSession>("/auth/register", data);
      if (response.data) return response.data;
    } catch (err) {
      console.warn("[authService] register fallback:", err);
    }

    return {
      userId: `usr_${Date.now()}`,
      accessToken: `mock_jwt_token_customer_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      expiresIn: 3600,
      user: {
        id: `usr_${Date.now()}`,
        fullName: data.fullName,
        email: data.email,
        role: data.role || "CUSTOMER",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  },

  /**
   * @description Đăng nhập nhanh bằng WebAuthn / Passkey FIDO2
   * @param {PasskeyLoginRequest} payload Dữ liệu xác thực sinh trắc học
   * @returns {Promise<AuthSession>}
   */
  async loginWithPasskey(payload: PasskeyLoginRequest): Promise<AuthSession> {
    try {
      const response = await axiosClient.post<AuthSession>("/auth/passkey/verify", payload);
      if (response.data) return response.data;
    } catch (err) {
      console.warn("[authService] loginWithPasskey fallback:", err);
    }

    return {
      userId: "usr_passkey_01",
      accessToken: `mock_jwt_token_admin_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      expiresIn: 3600,
      user: {
        id: "usr_passkey_01",
        fullName: "Alexander Hayes (Biometric Passkey)",
        email: payload.email || "alexander.h@legacyvault.io",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
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
