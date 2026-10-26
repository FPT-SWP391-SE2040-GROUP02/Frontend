import { ROLES } from "@/shared/constants/roles";
import { STATUS } from "@/shared/constants";
import type { BackendUserResponse } from "./backendUser.schema";

/** Roles hệ thống của Backend chính thức; quan hệ tài nguyên được kiểm tra riêng. */
export const AUTH_SYSTEM_ROLES = {
  USER: ROLES.USER,
  VERIFIER: ROLES.VERIFIER,
  ADMIN: ROLES.ADMIN,
  EXECUTOR: ROLES.EXECUTOR,
} as const;
/** Trạng thái tài khoản của UserResponse C#. */
export const AUTH_USER_STATUSES = {
  ACTIVE: STATUS.ACTIVE,
  LOCKED: STATUS.LOCKED,
  DISABLED: STATUS.DISABLED,
} as const;
/** DTO công khai của Backend, không chứa password hash hoặc token. */
export type AuthUserDto = BackendUserResponse;
/** Response raw login/refresh; credential chỉ đi vào RAM chuyên dụng. */
export interface AuthSessionDto {
  accessToken: string;
  expiresIn: number;
  user: AuthUserDto;
}
/** GET session trả trực tiếp UserResponse. */
export type CurrentSessionDto = AuthUserDto;
/** Proof raw do GET csrf cấp. */
export interface AuthCsrfTokenDto {
  requestToken: string;
}
/** Body LoginRequest C#. */
export interface AuthLoginRequestDto {
  email: string;
  password: string;
  rememberMe: boolean;
}
/** Body tùy chọn LogoutRequest C#. */
export interface AuthLogoutRequestDto {
  revokeAllDevices: boolean;
}
