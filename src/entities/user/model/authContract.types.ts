import { ROLES } from "@/shared/constants/roles";
import { STATUS } from "@/shared/constants";

/** System roles serialized by the current C# UserDto; vault relationships are separate. */
export const AUTH_SYSTEM_ROLES = {
  OWNER: ROLES.OWNER,
  VERIFIER: "VERIFIER",
  ADMIN: ROLES.ADMIN,
} as const;

/** Account statuses serialized by the current C# UserDto. */
export const AUTH_USER_STATUSES = {
  PENDING: STATUS.PENDING,
  ACTIVE: STATUS.ACTIVE,
  INACTIVE: STATUS.INACTIVE,
} as const;

/** Exact public UserDto from backend Identity/AuthDtos.cs. */
export interface AuthUserDto {
  /** Account identifier. */
  id: string;
  /** Normalized email. */
  email: string;
  /** Display name. */
  fullName: string;
  /** Optional phone serialized as null when absent. */
  phone: string | null;
  /** Server-assigned system role. */
  role: (typeof AUTH_SYSTEM_ROLES)[keyof typeof AUTH_SYSTEM_ROLES];
  /** Server-assigned account status. */
  status: (typeof AUTH_USER_STATUSES)[keyof typeof AUTH_USER_STATUSES];
  /** ISO timestamp with timezone. */
  createdAt: string;
  /** Nullable last update timestamp. */
  updatedAt: string | null;
}

/** Login/refresh response payload; both bearer secrets are HttpOnly cookies. */
export interface AuthSessionDto {
  /** Account identifier for this session. */
  userId: string;
  /** Remaining access JWT lifetime in seconds. */
  expiresIn: number;
  /** Public account data. */
  user: AuthUserDto;
}

/** GET /auth/session payload. */
export interface CurrentSessionDto {
  /** Public account data. */
  user: AuthUserDto;
}

/** Exact successful backend envelope; no legacy success/message fields are required. */
export interface AuthApiResponse<T> {
  /** Endpoint payload, unwrapped once by the owning API service. */
  data: T;
}

/** POST /auth/login request; form defaults supply rememberMe explicitly. */
export interface AuthLoginRequestDto {
  /** Email supplied by the user. */
  email: string;
  /** Password kept only for the request. */
  password: string;
  /** Whether the refresh cookie persists across browser sessions. */
  rememberMe: boolean;
}

/** POST /auth/logout optional body. */
export interface AuthLogoutRequestDto {
  /** Revoke every device when authorized; otherwise only the current family. */
  revokeAllDevices: boolean;
}
