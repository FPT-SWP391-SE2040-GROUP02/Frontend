import { z } from "zod";
import { paginatedListSchema } from "@/shared/api/pagination.schema";

/** Vai trò tài khoản theo `UserRole` của Backend (wire viết hoa). */
export const ADMIN_USER_ROLES = ["USER", "VERIFIER", "ADMIN"] as const;
/** Trạng thái tài khoản theo `UserStatus` của Backend (wire viết hoa). */
export const ADMIN_USER_STATUSES = ["ACTIVE", "LOCKED", "DISABLED"] as const;

export const adminUserRoleSchema = z.enum(ADMIN_USER_ROLES);
export const adminUserStatusSchema = z.enum(ADMIN_USER_STATUSES);
export type AdminUserRole = z.infer<typeof adminUserRoleSchema>;
export type AdminUserStatus = z.infer<typeof adminUserStatusSchema>;

const counter = z.number().int().nonnegative();
const dateTime = z.string().datetime({ offset: true });

/** GET /admin/dashboard → AdminDashboardResponse (raw, không envelope). */
export const adminDashboardSchema = z.object({
  openIncidents: counter,
  overdueIncidents: counter,
  unassignedIncidents: counter,
  activeHolds: counter,
  holdsPastReview: counter,
  activeVerifiers: counter,
  activeAdmins: counter,
  casesWithoutVerifier: counter,
  serverTime: dateTime,
});
export type AdminDashboard = z.infer<typeof adminDashboardSchema>;

/** AdminUserResponse: không có mật khẩu, kho hay tài sản. */
export const adminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  fullName: z.string(),
  role: adminUserRoleSchema,
  status: adminUserStatusSchema,
  emailVerified: z.boolean(),
  createdAt: dateTime,
  lastLoginAt: dateTime.nullable(),
  etag: z.string(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminUsersPageSchema = paginatedListSchema(adminUserSchema);
export type AdminUsersPage = z.infer<typeof adminUsersPageSchema>;

/** Kích thước trang cố định của màn hình Người dùng. */
export const ADMIN_USERS_PAGE_SIZE = 20;

/**
 * Query của GET /admin/users. Tên `search` theo AdminController,
 * khác `searchTerm` của PaginationRequest dùng chung.
 */
export const adminUsersQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  role: adminUserRoleSchema.optional(),
  status: adminUserStatusSchema.optional(),
  pageIndex: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
});
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
