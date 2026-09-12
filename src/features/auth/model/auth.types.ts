import { type Role } from "@/shared/constants/roles";
import { type User } from "@/entities/user";

/**
 * @description Thông tin phiên đăng nhập người dùng (Auth Session) trả về từ Backend C#.
 */
export interface AuthSession {
  /** Mã định danh tài khoản */
  userId: string;
  /** JWT Token truy cập hệ thống */
  accessToken: string;
  /** Refresh Token để cấp lại accessToken mới */
  refreshToken: string;
  /** Thời gian hết hạn của accessToken (tính bằng giây) */
  expiresIn: number;
  /** Thông tin người dùng cơ bản */
  user: User;
}

/**
 * @description Payload yêu cầu đăng nhập bằng Email và Password.
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * @description Payload yêu cầu đăng ký tài khoản chính chủ mới.
 */
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  role?: Role;
}

/**
 * @description Payload đăng nhập bằng Passkey / WebAuthn FIDO2.
 */
export interface PasskeyLoginRequest {
  email: string;
  credentialId: string;
  clientDataJson: string;
  authenticatorData: string;
  signature: string;
}

/**
 * @description Payload xác thực mã OTP 6 số.
 */
export interface OtpVerificationRequest {
  email: string;
  otpCode: string;
  type: "LOGIN_2FA" | "REGISTER_CONFIRM" | "PASSWORD_RESET";
}
