/**
 * @description Danh sách các vai trò (Roles) trong hệ thống SWP391.
 * Tương thích với chuẩn phân quyền ASP.NET Core Identity RBAC.
 */
export const ROLES = {
  /** Quản trị viên tối cao: Toàn quyền hệ thống */
  ADMIN: "ADMIN",
  /** Nhân viên / Quản lý nghiệp vụ */
  STAFF: "STAFF",
  /** Khách hàng / Người dùng thông thường */
  CUSTOMER: "CUSTOMER",
  /** Khách vãng lai chưa đăng nhập */
  GUEST: "GUEST",
} as const;

/** Kiểu dữ liệu tương ứng của danh sách vai trò người dùng */
export type Role = (typeof ROLES)[keyof typeof ROLES];
