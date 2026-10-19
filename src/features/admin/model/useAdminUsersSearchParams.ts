import { useSearchParams } from "react-router-dom";
import {
  ADMIN_USERS_PAGE_SIZE,
  adminUserRoleSchema,
  adminUserStatusSchema,
  type AdminUserRole,
  type AdminUserStatus,
  type AdminUsersQuery,
} from "./admin.schema";

export interface AdminUsersFilters {
  search: string;
  role: AdminUserRole | undefined;
  status: AdminUserStatus | undefined;
}

const MAX_PAGE = 1_000_000;

function readPage(value: string | null) {
  const page = Number(value ?? 1);
  if (Number.isSafeInteger(page) && page > 0 && page <= MAX_PAGE) return page;
  return 1;
}

/**
 * Bộ lọc Người dùng nằm trên URL (`q`, `role`, `status`, `page`).
 * Giá trị ngoài enum hoặc trang sai bị bỏ qua thay vì gửi lên BE.
 */
export function useAdminUsersSearchParams() {
  const [params, setParams] = useSearchParams();
  const role = adminUserRoleSchema.safeParse(params.get("role"));
  const status = adminUserStatusSchema.safeParse(params.get("status"));
  const filters: AdminUsersFilters = {
    search: (params.get("q") ?? "").trim().slice(0, 200),
    role: role.success ? role.data : undefined,
    status: status.success ? status.data : undefined,
  };
  const page = readPage(params.get("page"));
  const query: AdminUsersQuery = {
    search: filters.search || undefined,
    role: filters.role,
    status: filters.status,
    pageIndex: page,
    pageSize: ADMIN_USERS_PAGE_SIZE,
  };
  const hasFilters = Boolean(filters.search || filters.role || filters.status);

  /**
   * Đổi filter luôn quay về trang 1; chỉ chạm key có trong `patch`.
   * Dùng updater theo URL mới nhất để lần ghi search trễ (debounce) không xoá filter vừa đổi.
   * `replace` để gõ tìm kiếm không làm đầy lịch sử.
   */
  const setFilters = (patch: Partial<AdminUsersFilters>, replace = false) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        const entries: [string, string | undefined][] = [];
        if ("search" in patch) entries.push(["q", patch.search?.trim() || undefined]);
        if ("role" in patch) entries.push(["role", patch.role]);
        if ("status" in patch) entries.push(["status", patch.status]);
        for (const [key, value] of entries) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        next.delete("page");
        return next;
      },
      { replace },
    );
  };

  const setPage = (value: number) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value <= 1) next.delete("page");
      else next.set("page", String(Math.min(value, MAX_PAGE)));
      return next;
    });
  };

  const clearFilters = () => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      ["q", "role", "status", "page"].forEach((key) => next.delete(key));
      return next;
    });
  };

  return { filters, page, query, hasFilters, setFilters, setPage, clearFilters };
}
