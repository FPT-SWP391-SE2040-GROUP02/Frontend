import { createBaseService } from "@/shared/api/baseService";
import type {
  PricingPlan,
  CreatePaymentOrderRequest,
  PaymentOrder,
  Invoice,
} from "../model/billing.types";
import { apiClient } from "@/shared/api/axiosClient";

const baseBillingService = createBaseService<Invoice>({
  endpoint: "/billing",
});

/**
 * @description Dịch vụ gọi API Thanh toán SePay VietQR & Gói dịch vụ Két Di Sản.
 * Tuân thủ quy tắc 7: Để lại comment // TODO rõ ràng cho developer tự hoàn thiện code logic.
 */
export const billingService = {
  ...baseBillingService,

  /**
   * @description Lấy danh sách các gói dịch vụ Két Di Sản
   * @returns {Promise<PricingPlan[]>} Danh sách bảng giá
   */
  async getPricingPlans(): Promise<PricingPlan[]> {
    // TODO: 1. Gọi API GET /api/v1/billing/plans
    // TODO: 2. Trả về danh sách PricingPlan[]
    const response = await apiClient.get<PricingPlan[]>("/billing/plans");
    return response.data;
  },

  /**
   * @description Khởi tạo đơn hàng thanh toán SePay VietQR
   * @param {CreatePaymentOrderRequest} payload Dữ liệu tạo đơn
   * @returns {Promise<PaymentOrder>} Thông tin mã QR và cú pháp chuyển khoản
   */
  async createPaymentOrder(payload: CreatePaymentOrderRequest): Promise<PaymentOrder> {
    // TODO: 1. Gọi API POST /api/v1/billing/orders
    // TODO: 2. Backend C# sinh mã QR VietQR động và cú pháp SePay
    // TODO: 3. Trả về PaymentOrder
    const response = await apiClient.post<PaymentOrder>("/billing/orders", payload);
    return response.data;
  },

  /**
   * @description Kiểm tra trạng thái thanh toán thời gian thực (Polling SePay Webhook)
   * @param {string} orderId Mã đơn hàng
   * @returns {Promise<{ isPaid: boolean; status: string }>} Trạng thái thanh toán
   */
  async checkPaymentStatus(orderId: string): Promise<{ isPaid: boolean; status: string }> {
    // TODO: 1. Gọi API GET /api/v1/billing/orders/{orderId}/status
    // TODO: 2. Trả về đối tượng trạng thái giao dịch
    const response = await apiClient.get<{ isPaid: boolean; status: string }>(
      `/billing/orders/${orderId}/status`
    );
    return response.data;
  },

  /**
   * @description Lấy lịch sử hóa đơn thanh toán của người dùng
   * @returns {Promise<Invoice[]>} Danh sách hóa đơn
   */
  async getInvoices(): Promise<Invoice[]> {
    // TODO: 1. Gọi API GET /api/v1/billing/invoices
    const response = await apiClient.get<Invoice[]>("/billing/invoices");
    return response.data;
  },
};
