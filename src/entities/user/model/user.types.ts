import { type Role } from "@/shared/constants/roles";
import { type Status } from "@/shared/constants";

/**
 * @description Thực thể người dùng cốt lõi (User Entity) trong toàn bộ ứng dụng.
 */
export interface User {
  /** Mã định danh duy nhất của người dùng */
  id: string;
  /** Địa chỉ email tài khoản */
  email: string;
  /** Họ và tên hiển thị */
  fullName: string;
  /** Số điện thoại liên hệ */
  phone?: string;
  /** Đường dẫn ảnh đại diện */
  avatarUrl?: string;
  /** Vai trò của người dùng trong hệ thống (ADMIN, STAFF, CUSTOMER) */
  role: Role;
  /** Trạng thái tài khoản (ACTIVE, INACTIVE, PENDING...) */
  status: Status;
  /** Thời điểm khởi tạo tài khoản (ISO String) */
  createdAt: string;
  /** Thời điểm cập nhật thông tin gần nhất */
  updatedAt?: string;
}

/**
 * @description Thông tin hồ sơ người dùng (User Profile DTO) phục vụ trang cá nhân.
 */
export interface UserProfile extends Omit<User, "createdAt" | "updatedAt"> {
  /** Địa chỉ nơi ở */
  address?: string;
  /** Giới tính */
  gender?: "MALE" | "FEMALE" | "OTHER";
  /** Ngày sinh (YYYY-MM-DD) */
  birthDate?: string;
}
