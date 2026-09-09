import { type User } from "@/entities/user";
import { type AuthToken } from "@/entities/session";

/**
 * @description DTO truyền vào khi thực hiện đăng nhập tài khoản.
 */
export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * @description DTO truyền vào khi thực hiện đăng ký tài khoản mới.
 */
export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

/**
 * @description Dữ liệu trả về từ backend C# khi xác thực thành công.
 */
export interface AuthResponse {
  user: User;
  token: AuthToken;
}
