import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { POLLING_INTERVAL } from "@/shared/config";
import { adminService } from "../api/adminService";
import type {
  AdminRevenueQuery,
  AdminUserRole,
  AdminUsersQuery,
  PaymentTransactionsQuery,
} from "./admin.schema";

export const adminKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminKeys.all, "dashboard"] as const,
  users: (query: AdminUsersQuery) => [...adminKeys.all, "users", query] as const,
  user: (userId: string) => [...adminKeys.all, "user", userId] as const,
  executorSearch: (search: string) => [...adminKeys.all, "executor-search", search] as const,
  userOptions: (role: AdminUserRole) => [...adminKeys.all, "user-options", role] as const,
  paymentTransactions: (query: PaymentTransactionsQuery) =>
    [...adminKeys.all, "payment-transactions", query] as const,
  revenue: (query: AdminRevenueQuery) => [...adminKeys.all, "revenue", query] as const,
};

/** Bộ đếm tổng quan; không tự retry để 404/401 hiện ngay; tự động refetch định kỳ. */
export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: ({ signal }) => adminService.getDashboard(signal),
    staleTime: 15_000,
    retry: false,
    refetchInterval: POLLING_INTERVAL.NORMAL,
    refetchIntervalInBackground: false,
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

/** Chi tiết một tài khoản; không tự retry để 404 hiện ngay. */
export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: adminKeys.user(userId),
    queryFn: ({ signal }) => adminService.getUser(userId, signal),
    retry: false,
  });
}

/** Người đang hoạt động theo vai trò, để chọn người phụ trách hoặc người xét duyệt (tối đa 100). */
export function useAdminUserOptions(role: AdminUserRole, enabled = true) {
  return useQuery({
    queryKey: adminKeys.userOptions(role),
    queryFn: ({ signal }) =>
      adminService.listUsers({ role, status: "ACTIVE", pageIndex: 1, pageSize: 100 }, signal),
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}

/** Tìm Người thực thi đang hoạt động theo tên hoặc email, để chọn người mới cho một kho (tối đa 20). */
export function useAdminExecutorSearch(search: string) {
  return useQuery({
    queryKey: adminKeys.executorSearch(search),
    queryFn: ({ signal }) =>
      adminService.listUsers(
        {
          search: search || undefined,
          role: "EXECUTOR",
          status: "ACTIVE",
          pageIndex: 1,
          pageSize: 20,
        },
        signal,
      ),
    staleTime: 15_000,
    retry: false,
  });
}

/** Số tài khoản theo vai trò cho thẻ lọc. */
export function useAdminUserCounts(query: { search?: string; status?: string }) {
  return useQuery({
    queryKey: [...adminKeys.all, "user-counts", query] as const,
    queryFn: ({ signal }) => adminService.countUsers(query, signal),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

/** Một trang giao dịch tiền vào; giữ trang trước khi đổi bộ lọc để bảng không nháy trắng. */
export function useAdminRevenue(query: AdminRevenueQuery) {
  return useQuery({
    queryKey: adminKeys.revenue(query),
    queryFn: ({ signal }) => adminService.getRevenue(query, signal),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useAdminPaymentTransactions(query: PaymentTransactionsQuery) {
  return useQuery({
    queryKey: adminKeys.paymentTransactions(query),
    queryFn: ({ signal }) => adminService.listPaymentTransactions(query, signal),
    placeholderData: keepPreviousData,
    retry: false,
  });
}
