/** Alias session raw Backend; không dùng userId/envelope legacy. */
export type AuthSession = import("@/entities/user/model/authContract.types").AuthSessionDto;

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
  linkTicket: string;
  password: string;
  rememberMe: boolean;
}

/**
 * @description Yêu cầu xác thực hai bước TOTP cho tài khoản quản trị (Mockup 7).
 */
export interface TwoFactorVerifyRequest {
  /** Token thử thách từ login/google/link-confirm; chỉ giữ trong RAM. */
  challengeToken: string;
  /** Mã TOTP 6 số hoặc mã khôi phục. */
  code: string;
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
