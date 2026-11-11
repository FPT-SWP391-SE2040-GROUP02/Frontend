/** Public API của slice Admin: dashboard, sự cố, tạm giữ, tài khoản và cấu hình hệ thống. */
export { AdminOverview } from "./ui/AdminOverview";
export { AdminOverviewToolbar } from "./ui/AdminOverviewToolbar";
export { AdminUsers } from "./ui/AdminUsers";
export { AdminIncidents } from "./ui/AdminIncidents";
export { AdminHolds } from "./ui/AdminHolds";
export { AdminPayments } from "./ui/AdminPayments";
export { AdminHandoverTemplates } from "./ui/AdminHandoverTemplates";
export { AdminDevTools } from "./ui/AdminDevTools";
export { ExecutorEmailPreviewPanel } from "./ui/ExecutorEmailPreviewPanel";
export { AdminSettings } from "./ui/AdminSettings";
export { AdminSystemConfig } from "./ui/AdminSystemConfig";
export { ADMIN_INCIDENTS_VISIBLE } from "./model/admin.content";
export { adminService } from "./api/adminService";
export { adminSettingsService } from "./api/adminSettingsService";
export { adminKeys, useAdminDashboard, useAdminUsers } from "./model/useAdmin";
export type {
  AdminDashboard,
  AdminUser,
  AdminUserRole,
  AdminUserStatus,
  AdminUsersPage,
  AdminUsersQuery,
} from "./model/admin.schema";
export type { SystemSetting, UpdateSystemSettingInput } from "./model/adminSettings.types";
