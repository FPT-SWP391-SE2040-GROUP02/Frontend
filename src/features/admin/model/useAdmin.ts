import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { POLLING_INTERVAL } from "@/shared/config";
import { adminService } from "../api/adminService";
import type {
  AdminUserRole,
  AdminUsersQuery,
  HoldsQuery,
  IncidentsQuery,
  PaymentTransactionsQuery,
} from "./admin.schema";

export const adminKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminKeys.all, "dashboard"] as const,
  users: (query: AdminUsersQuery) => [...adminKeys.all, "users", query] as const,
  user: (userId: string) => [...adminKeys.all, "user", userId] as const,
  userOptions: (role: AdminUserRole) => [...adminKeys.all, "user-options", role] as const,
  incidents: (query: IncidentsQuery) => [...adminKeys.all, "incidents", query] as const,
  incident: (incidentId: string) => [...adminKeys.all, "incident", incidentId] as const,
  holds: (query: HoldsQuery) => [...adminKeys.all, "holds", query] as const,
  hold: (holdId: string) => [...adminKeys.all, "hold", holdId] as const,
  paymentTransactions: (query: PaymentTransactionsQuery) =>
    [...adminKeys.all, "payment-transactions", query] as const,
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

export function useAdminIncidents(query: IncidentsQuery) {
  return useQuery({
    queryKey: adminKeys.incidents(query),
    queryFn: ({ signal }) => adminService.listIncidents(query, signal),
    placeholderData: keepPreviousData,
    retry: false,
    refetchInterval: POLLING_INTERVAL.NORMAL,
    refetchIntervalInBackground: false,
  });
}

export function useAdminIncident(incidentId: string) {
  return useQuery({
    queryKey: adminKeys.incident(incidentId),
    queryFn: ({ signal }) => adminService.getIncident(incidentId, signal),
    retry: false,
  });
}

/** Số sự cố theo trạng thái cho thẻ lọc; làm mới cùng nhịp với danh sách sự cố. */
export function useAdminIncidentCounts(
  query: Omit<IncidentsQuery, "status" | "pageIndex" | "pageSize">,
) {
  return useQuery({
    queryKey: [...adminKeys.all, "incident-counts", query] as const,
    queryFn: ({ signal }) => adminService.countIncidents(query, signal),
    placeholderData: keepPreviousData,
    retry: false,
    refetchInterval: POLLING_INTERVAL.NORMAL,
    refetchIntervalInBackground: false,
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

/** Số tạm giữ theo trạng thái cho thẻ lọc. */
export function useAdminHoldCounts() {
  return useQuery({
    queryKey: [...adminKeys.all, "hold-counts"] as const,
    queryFn: ({ signal }) => adminService.countHolds(signal),
    retry: false,
  });
}

export function useAdminHolds(query: HoldsQuery) {
  return useQuery({
    queryKey: adminKeys.holds(query),
    queryFn: ({ signal }) => adminService.listHolds(query, signal),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useAdminHold(holdId: string) {
  return useQuery({
    queryKey: adminKeys.hold(holdId),
    queryFn: ({ signal }) => adminService.getHold(holdId, signal),
    retry: false,
  });
}

/** Một trang giao dịch tiền vào; giữ trang trước khi đổi bộ lọc để bảng không nháy trắng. */
export function useAdminPaymentTransactions(query: PaymentTransactionsQuery) {
  return useQuery({
    queryKey: adminKeys.paymentTransactions(query),
    queryFn: ({ signal }) => adminService.listPaymentTransactions(query, signal),
    placeholderData: keepPreviousData,
    retry: false,
  });
}
