import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminService } from "../api/adminService";
import type { AdminUsersQuery } from "./admin.schema";

export const adminKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminKeys.all, "dashboard"] as const,
  users: (query: AdminUsersQuery) => [...adminKeys.all, "users", query] as const,
};

/** Bộ đếm tổng quan; không tự retry để 404/401 hiện ngay. */
export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: ({ signal }) => adminService.getDashboard(signal),
    staleTime: 30_000,
    retry: false,
  });
}

/** Một trang tài khoản; giữ trang trước khi đổi filter/trang để bảng không nháy trắng. */
export function useAdminUsers(query: AdminUsersQuery) {
  return useQuery({
    queryKey: adminKeys.users(query),
    queryFn: ({ signal }) => adminService.listUsers(query, signal),
    placeholderData: keepPreviousData,
    retry: false,
  });
}
