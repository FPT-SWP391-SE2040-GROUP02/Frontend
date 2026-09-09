import type { LoginInput, RegisterInput, AuthResponse } from "../model/auth.types";
import type { User } from "@/entities/user";

/**
 * @description Authentication API Service tương tác với Auth Controller của C# ASP.NET Core Backend.
 * Tuân thủ Quy tắc 7: Chỉ dựng khung chữ ký hàm, developer tự hoàn thiện code logic theo hướng dẫn // TODO.
 */
export const authService = {
  /**
   * @description Gửi yêu cầu đăng nhập tài khoản.
   * @param {_credentials} _credentials Email và Mật khẩu
   * @returns {Promise<AuthResponse>} Dữ liệu người dùng kèm JWT Token
   */
  login: async (_credentials: LoginInput): Promise<AuthResponse> => {
    // TODO: 1. Gửi request POST tới endpoint backend C# (ví dụ: "/auth/login") với payload _credentials
    // TODO: 2. Nhận response chứa { user, token: { accessToken, refreshToken } }
    // TODO: 3. Trả về AuthResponse hoàn chỉnh
    throw new Error("Chưa cài đặt authService.login - Vui lòng tự hoàn thiện code logic tại đây.");
  },

  /**
   * @description Gửi yêu cầu đăng ký tài khoản mới.
   * @param {_data} _data Thông tin đăng ký gồm fullName, email, password, phone...
   * @returns {Promise<AuthResponse>}
   */
  register: async (_data: RegisterInput): Promise<AuthResponse> => {
    // TODO: 1. Gửi request POST tới endpoint backend C# (ví dụ: "/auth/register") với payload _data
    // TODO: 2. Nhận response trả về và trả về AuthResponse
    throw new Error("Chưa cài đặt authService.register - Vui lòng tự hoàn thiện code logic tại đây.");
  },

  /**
   * @description Lấy thông tin người dùng hiện tại thông qua Bearer Token.
   * @returns {Promise<User>}
   */
  getCurrentUser: async (): Promise<User> => {
    // TODO: 1. Gửi request GET tới endpoint "/auth/me" hoặc "/users/profile"
    // TODO: 2. Trả về đối tượng User
    throw new Error("Chưa cài đặt authService.getCurrentUser - Vui lòng tự hoàn thiện code logic tại đây.");
  },

  /**
   * @description Gửi yêu cầu đăng xuất tài khoản và thu hồi token phía server.
   */
  logout: async (): Promise<void> => {
    // TODO: 1. Gửi request POST tới endpoint "/auth/logout" (nếu backend C# có hỗ trợ thu hồi refresh token)
    // TODO: 2. Xóa sạch token khỏi storage ở client
  },
};
