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
    mutationFn: (payload: CreatePaymentOrderRequest) =>
      billingService.createPaymentOrder(payload),
  });
}

/**
 * @description Hook polling trạng thái thanh toán đơn hàng SePay mỗi 3 giây
 * @param {string | undefined} orderId Mã đơn hàng
 * @param {boolean} enabled Trạng thái kích hoạt polling
 */
export function usePollPaymentStatus(orderId?: string, enabled = true) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: billingKeys.orderStatus(orderId || ""),
    queryFn: () => billingService.checkPaymentStatus(orderId || ""),
    enabled: Boolean(orderId) && enabled,
    refetchInterval: (query) => {
      // Dừng polling khi đã thanh toán thành công hoặc hết hạn
      if (query.state.data?.isPaid) {
        queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
        return false;
      }
      return 3000; // Poll mỗi 3 giây
    },
  });
}

/**
 * @description Hook lấy danh sách lịch sử hóa đơn thanh toán
 */
export function useInvoices() {
  return useQuery({
    queryKey: billingKeys.invoices(),
    queryFn: () => billingService.getInvoices(),
  });
}
