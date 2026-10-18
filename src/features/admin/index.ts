/** Public API của slice Admin chỉ đọc (dashboard + tài khoản). */
export { AdminOverview } from "./ui/AdminOverview";
export { AdminUsers } from "./ui/AdminUsers";
export { adminService } from "./api/adminService";
export { adminKeys, useAdminDashboard, useAdminUsers } from "./model/useAdmin";
export type {
  AdminDashboard,
  AdminUser,
  AdminUserRole,
  AdminUserStatus,
  AdminUsersPage,
  AdminUsersQuery,
} from "./model/admin.schema";
