import { apiClient } from "@/shared/api";
import {
  adminDashboardSchema,
  adminUsersPageSchema,
  adminUsersQuerySchema,
  type AdminUsersQuery,
} from "../model/admin.schema";

/** Transport Admin chỉ đọc theo AdminController; không Admin → BE trả 404 (SEC-04). */
export const adminService = {
  /** Bộ đếm vận hành và giờ máy chủ. */
  async getDashboard(signal?: AbortSignal) {
    return adminDashboardSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/dashboard", { signal }),
    );
  },
  /** Danh sách tài khoản; bỏ `search` rỗng thay vì gửi `search=`. */
  async listUsers(query: AdminUsersQuery, signal?: AbortSignal) {
    const parsed = adminUsersQuerySchema.parse(query);
    const params: Record<string, string | number> = {
      pageIndex: parsed.pageIndex,
      pageSize: parsed.pageSize,
    };
    if (parsed.search) params.search = parsed.search;
    if (parsed.role) params.role = parsed.role;
    if (parsed.status) params.status = parsed.status;
    return adminUsersPageSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/users", { params, signal }),
    );
  },
};
