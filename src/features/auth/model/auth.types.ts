import { type Role } from "@/shared/constants/roles";
import { type User } from "@/entities/user";

/**
 * @description Model phiên legacy của FE; chưa phải DTO Auth C# đã xác nhận.
 * Refresh token chỉ do BE quản lý qua cookie HttpOnly theo ADR-0003.
 * Cần chuyển expiresIn/user sang DTO thực khi BE1 bàn giao Auth.
 */
export interface AuthSession {
  /** Mã định danh tài khoản */
  userId: string;
  /** JWT Token truy cập hệ thống */
  accessToken: string;
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

/**
 * @description Trạng thái khóa tạm thời khi nhập sai mật khẩu quá 5 lần (Mockup 3).
 */
export interface LockoutInfo {
  /** Cờ cho biết tài khoản đang bị khóa tạm thời */
  isLocked: boolean;
  /** Thời điểm sẽ mở khóa (ISO String hoặc định dạng HH:mm) */
  unlockAt?: string;
  /** Số giây còn lại */
  remainingSeconds: number;
  /** Số lượt thử còn lại trước khi bị khóa */
  attemptsRemaining: number;
}

/**
 * @description Dữ liệu ngữ cảnh khi đăng nhập từ lời mời nhận di sản (Mockup 4).
 */
export interface InvitationContext {
  token: string;
  packageName: string;
  inviterName?: string;
  inviterEmail?: string;
}

/**
 * @description Yêu cầu xác nhận mật khẩu hiện tại để liên kết tài khoản Google (Mockup 5).
 */
export interface LinkGoogleRequest {
  email: string;
  currentPassword: string;
  googleAuthCode?: string;
}

/**
 * @description Yêu cầu xác thực hai bước TOTP cho tài khoản quản trị (Mockup 7).
 */
export interface TwoFactorVerifyRequest {
  code: string;
  rememberDevice?: boolean;
}

/**
 * @description Tùy chọn khi người dùng xác nhận đăng xuất (Mockup 8).
 */
export interface LogoutOptions {
  /** Đăng xuất khỏi mọi thiết bị đang đăng nhập */
  revokeAllDevices?: boolean;
  /** Lý do đăng xuất */
  reason?: "USER_INITIATED" | "SESSION_TIMEOUT" | "SECURITY_REVOCATION";
}
