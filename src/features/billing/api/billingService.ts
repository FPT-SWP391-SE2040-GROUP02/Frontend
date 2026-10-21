import { z } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import {
  billingPlansSchema,
  billingQuoteSchema,
  billingSelectionSchema,
  paymentOrderSchema,
} from "../model/billing.schema";
import type { BillingSelection } from "../model/billing.types";

const orderId = z.string().uuid();

/**
 * Gọi API thanh toán `/billing/*` (hợp đồng mục 6.18). Kho luôn là kho của người đang đăng nhập;
 * client chỉ gửi lựa chọn (hạng, số năm, suất thêm), không gửi số tiền, loại đơn hay trạng thái.
 */
export const billingService = {
  /** Bảng giá hiện hành do Backend công bố. */
  async getPlans(signal?: AbortSignal) {
    return billingPlansSchema.parse(
      await apiClient.get<unknown, unknown>("/billing/plans", { signal }),
    );
  },

  /** Báo giá, không ghi DB. Lỗi 409 PAYMENT_NOT_ALLOWED cho biết vì sao chưa mua được. */
  async quote(selection: BillingSelection, signal?: AbortSignal) {
    return billingQuoteSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/billing/quote",
        billingSelectionSchema.parse(selection),
        {
          signal,
        },
      ),
    );
  },

  /** Tạo đơn (201) hoặc nhận lại đơn PENDING cùng lựa chọn (200). */
  async createOrder(selection: BillingSelection) {
    return paymentOrderSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/billing/orders",
        billingSelectionSchema.parse(selection),
      ),
    );
  },

  /** Đơn đang chờ của kho; 204 (không có hoặc vừa hết hạn) trả về null. */
  async getCurrentOrder(signal?: AbortSignal) {
    const data = await apiClient.get<unknown, unknown>("/billing/orders/current", { signal });
    if (data === "" || data === null || data === undefined) return null;
    return paymentOrderSchema.parse(data);
  },

  async getOrder(id: string, signal?: AbortSignal) {
    return paymentOrderSchema.parse(
      await apiClient.get<unknown, unknown>(`/billing/orders/${orderId.parse(id)}`, { signal }),
    );
  },

  /** Hủy đơn đang chờ; hủy lặp vẫn trả đơn đã hủy. */
  async cancelOrder(id: string) {
    return paymentOrderSchema.parse(
      await apiClient.post<unknown, unknown>(`/billing/orders/${orderId.parse(id)}/cancel`),
    );
  },

  /** Giả lập trả tiền, chỉ chạy khi Backend ở Development và bật DevPaymentEnabled (ngoài ra là 404). */
  async devPay(id: string) {
    return paymentOrderSchema.parse(
      await apiClient.post<unknown, unknown>(`/billing/orders/${orderId.parse(id)}/dev-pay`),
    );
  },
};
