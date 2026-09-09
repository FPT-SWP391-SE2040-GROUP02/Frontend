import { type User } from "@/entities/user";

/**
 * @description Cấu trúc JWT Token phản hồi từ C# Backend.
 */
export interface AuthToken {
  /** Access Token dùng để đính kèm trong Header Authorization Bearer */
  accessToken: string;
  /** Refresh Token dùng để cấp lại Access Token mới khi hết hạn */
  refreshToken?: string;
  /** Thời gian sống của token tính bằng giây hoặc thời điểm hết hạn */
  expiresIn?: number;
}

/**
 * @description Trạng thái phiên làm việc (Session State) lưu trong Client Store.
 */
export interface SessionState {
  /** Người dùng hiện tại đang đăng nhập (hoặc null nếu chưa đăng nhập) */
  user: User | null;
  /** Mã JWT Token hiện tại */
  token: string | null;
  /** Cờ xác nhận đã xác thực thành công */
  isAuthenticated: boolean;
  /** Cờ trạng thái đang khôi phục phiên (chờ verify token) */
  isLoading: boolean;
}
