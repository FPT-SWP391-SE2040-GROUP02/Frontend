import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billingService } from "../api/billingService";
import type { CreatePaymentOrderRequest } from "./billing.types";

/**
 * @description Query Keys tập trung quản lý cache dữ liệu thanh toán và gói dịch vụ.
 */
export const billingKeys = {
  all: ["billing"] as const,
  plans: () => [...billingKeys.all, "plans"] as const,
  orderStatus: (orderId: string) => [...billingKeys.all, "order", orderId] as const,
  invoices: () => [...billingKeys.all, "invoices"] as const,
};

/**
 * @description Hook lấy danh sách bảng giá các gói Két Di Sản
 */
export function usePricingPlans() {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: () => billingService.getPricingPlans(),
    staleTime: 1000 * 60 * 10, // 10 phút
  });
}

/**
 * @description Hook khởi tạo đơn hàng thanh toán SePay VietQR
 */
export function useCreatePaymentOrder() {
  return useMutation({
    mutationFn: (payload: CreatePaymentOrderRequest) => billingService.createPaymentOrder(payload),
  });
}

/**
 * @description Hook polling trạng thái thanh toán đơn hàng SePay mỗi 3 giây
 * @param {string | undefined} orderId Mã đơn hàng
 * @param {boolean} enabled Trạng thái kích hoạt polling
 */
export function usePollPaymentStatus(orderId?: string, enabled = true, expiresAt?: string) {
  const queryClient = useQueryClient();
  const deadline = expiresAt ? Date.parse(expiresAt) : undefined;
  const canPoll = Boolean(orderId) && enabled;
  const query = useQuery({
    queryKey: billingKeys.orderStatus(orderId || ""),
    queryFn: () => billingService.checkPaymentStatus(orderId || ""),
    enabled: () =>
      canPoll && (deadline === undefined || (Number.isFinite(deadline) && deadline > Date.now())),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    refetchInterval: (current) => {
      if (
        !canPoll ||
        current.state.status === "error" ||
        (deadline !== undefined && deadline <= Date.now())
      )
        return false;
      const result = current.state.data;
      return result && (result.isPaid || result.status !== "PENDING") ? false : 3000;
    },
  });
  const isPaid = query.data?.isPaid === true && query.data.status === "PAID";
  useEffect(() => {
    if (isPaid) void queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
  }, [isPaid, orderId, queryClient]);
  return query;
}

/**
 * @description Hook lấy danh sách lịch sử hóa đơn thanh toán
 */
export function useInvoices(enabled = true) {
  return useQuery({
    queryKey: billingKeys.invoices(),
    enabled,
    queryFn: () => billingService.getInvoices(),
  });
}
