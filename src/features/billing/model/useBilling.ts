import { useQuery } from "@tanstack/react-query";
import { billingService } from "../api/billingService";
import type { BillingSelection, PaymentOrder } from "./billing.types";

/** Cache thanh toán theo kho; AuthBootstrap xóa cache khi đổi tài khoản. */
export const billingKeys = {
  all: ["billing"] as const,
  plans: () => [...billingKeys.all, "plans"] as const,
  quote: (selection: BillingSelection) => [...billingKeys.all, "quote", selection] as const,
  history: (pageIndex: number) => [...billingKeys.all, "history", pageIndex] as const,
  currentOrder: () => [...billingKeys.all, "order", "current"] as const,
  order: (id: string) => [...billingKeys.all, "order", id] as const,
};

/** Chu kỳ hỏi lại trạng thái đơn đang chờ; dừng khi đơn không còn PENDING. */
export const ORDER_POLL_MS = 3000;

export function useBillingPlans(enabled: boolean) {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: ({ signal }) => billingService.getPlans(signal),
    enabled,
    retry: false,
    staleTime: 10 * 60_000,
  });
}

/** Báo giá theo lựa chọn; chỉ chạy khi người dùng đang mở bước chọn mua. */
export function useBillingQuote(selection: BillingSelection, enabled: boolean) {
  return useQuery({
    queryKey: billingKeys.quote(selection),
    queryFn: ({ signal }) => billingService.quote(selection, signal),
    enabled,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}

/** Số đơn mỗi trang của lịch sử thanh toán. */
export const ORDER_HISTORY_PAGE_SIZE = 10;

/** Lịch sử đơn thanh toán của kho, phân trang, mới nhất trước. */
export function useOrderHistory(pageIndex: number, enabled: boolean) {
  return useQuery({
    queryKey: billingKeys.history(pageIndex),
    queryFn: ({ signal }) => billingService.listOrders(pageIndex, ORDER_HISTORY_PAGE_SIZE, signal),
    enabled,
    retry: false,
    staleTime: 0,
  });
}

/** Đơn đang chờ của kho (null khi không có). */
export function useCurrentOrder(enabled: boolean) {
  return useQuery({
    queryKey: billingKeys.currentOrder(),
    queryFn: ({ signal }) => billingService.getCurrentOrder(signal),
    enabled,
    retry: false,
    staleTime: 0,
  });
}

/** Còn hỏi lại khi đơn đang PENDING và lần đọc trước không lỗi; đơn đã trả, hết hạn hoặc hủy thì dừng. */
export function orderPollDelay(order: PaymentOrder | undefined, failed: boolean): number | false {
  if (failed) return false;
  if (order && order.status !== "PENDING") return false;
  return ORDER_POLL_MS;
}

/** Theo dõi một đơn: hỏi lại mỗi vài giây cho tới khi đơn rời trạng thái PENDING. */
export function useOrder(id: string, enabled: boolean) {
  return useQuery({
    queryKey: billingKeys.order(id),
    queryFn: ({ signal }) => billingService.getOrder(id, signal),
    enabled: enabled && Boolean(id),
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => orderPollDelay(query.state.data, query.state.status === "error"),
  });
}
