import { keepPreviousData, useQuery } from "@tanstack/react-query";
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
  userOptions: (role: AdminUserRole) => [...adminKeys.all, "user-options", role] as const,
  incidents: (query: IncidentsQuery) => [...adminKeys.all, "incidents", query] as const,
  incident: (incidentId: string) => [...adminKeys.all, "incident", incidentId] as const,
  holds: (query: HoldsQuery) => [...adminKeys.all, "holds", query] as const,
  hold: (holdId: string) => [...adminKeys.all, "hold", holdId] as const,
  paymentTransactions: (query: PaymentTransactionsQuery) =>
    [...adminKeys.all, "payment-transactions", query] as const,
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
  });
}

export function useAdminIncident(incidentId: string) {
  return useQuery({
    queryKey: adminKeys.incident(incidentId),
    queryFn: ({ signal }) => adminService.getIncident(incidentId, signal),
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
