import { apiClient } from "@/shared/api/axiosClient";
import { createBaseService } from "@/shared/api/baseService";
import type {
  CreatePaymentOrderRequest,
  Invoice,
  PaymentOrder,
  PricingPlan,
} from "../model/billing.types";

const baseBillingService = createBaseService<Invoice>({
  endpoint: "/billing",
});

/**
 * @description Dịch vụ gọi API Thanh toán SePay VietQR & Gói dịch vụ Két Di Sản.
 */
export const billingService = {
  ...baseBillingService,

  /**
   * @description Lấy danh sách các gói dịch vụ Két Di Sản
   * @returns {Promise<PricingPlan[]>} Danh sách bảng giá
   */
  async getPricingPlans(): Promise<PricingPlan[]> {
    // TODO: [P1][BILLING-01] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Migrate bảng giá sang contract plans/entitlement đã chốt.
    // 2. [INPUT & OUTPUT]: GET /plans -> gói Free/Legacy XS/XS Max, kỳ/quota/slots/priceVersion.
    // 3. [CÁC BƯỚC]: Sau AUTH-02 chốt DTO với BE2; schema/service/hooks; thay /billing/plans nếu roadmap được duyệt; adapter hiển thị tiền/bytes.
    // 4. [HÀM / THƯ VIỆN]: createBaseService/shared transport, Zod, TanStack Query.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không Recipient Plus; Free không tạo order 0 đồng; giá/quota do BE; không ép DTO PricingPlan mock lên server.
    const response = await apiClient.get<PricingPlan[]>("/billing/plans");
    return response.data;
  },

  /**
   * @description Khởi tạo đơn hàng thanh toán SePay VietQR
   * @param {CreatePaymentOrderRequest} payload Dữ liệu tạo đơn
   * @returns {Promise<PaymentOrder>} Thông tin mã QR và cú pháp chuyển khoản
   */
  async createPaymentOrder(payload: CreatePaymentOrderRequest): Promise<PaymentOrder> {
    // TODO: [P1][BILLING-02] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Tạo order theo giá BE và khóa idempotency.
    // 2. [INPUT & OUTPUT]: planId/term/add-on/purpose -> orderId/QR/amount/currency/expiresAt/status.
    // 3. [CÁC BƯỚC]: Sau BILLING-01 chốt POST /orders; migrate DTO; tạo khi xác nhận; reuse idempotency key cho cùng ý định; invalidate subscription khi BE xác nhận.
    // 4. [HÀM / THƯ VIỆN]: Shared transport, TanStack Query, Zod, crypto.randomUUID khi policy cho phép.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không tin amount FE; webhook SePay ở BE; lỗi mạng không tạo đơn mới tùy ý; payment không auto-activate kho hoặc cấp grant.
    const response = await apiClient.post<PaymentOrder>("/billing/orders", payload);
    return response.data;
  },

  /**
   * @description Kiểm tra trạng thái thanh toán thời gian thực (Polling SePay Webhook)
   * @param {string} orderId Mã đơn hàng
   * @returns {Promise<{ isPaid: boolean; status: string }>} Trạng thái thanh toán
   */
  async checkPaymentStatus(orderId: string): Promise<{ isPaid: boolean; status: string }> {
    // TODO: [P1][BILLING-03] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Polling trạng thái đơn có điểm dừng rõ ràng.
    // 2. [INPUT & OUTPUT]: orderId đúng quyền -> trạng thái/deadline/serverTime từ GET /orders/{id}.
    // 3. [CÁC BƯỚC]: Sau BILLING-02 migrate /billing/orders/{id}/status; chỉ poll khi PENDING và màn đang cần; dừng paid/cancelled/expired/reconciliation theo enum BE; invalidate một lần.
    // 4. [HÀM / THƯ VIỆN]: TanStack Query enabled/refetchInterval, queryKeys, service/schema Billing.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Dừng khi lỗi quyền hoặc terminal; không invalidate invoices trong mỗi lần tính interval; không optimistic payment hoặc đọc paid từ URL; backoff khi 429/network.
    const response = await apiClient.get<{ isPaid: boolean; status: string }>(
      `/billing/orders/${orderId}/status`,
    );
    return response.data;
  },

  /**
   * @description Lấy lịch sử hóa đơn thanh toán của người dùng
   * @returns {Promise<Invoice[]>} Danh sách hóa đơn
   */
  async getInvoices(): Promise<Invoice[]> {
    // TODO: [P1][BILLING-04] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Nối lịch sử và download chứng từ theo quyền.
    // 2. [INPUT & OUTPUT]: Pagination/query + invoiceId -> data/meta hoặc file private.
    // 3. [CÁC BƯỚC]: Sau BILLING-02 chốt GET /invoices và route download; migrate DTO/query; adapter; UI loading/error/empty/success.
    // 4. [HÀM / THƯ VIỆN]: createBaseService, TanStack Query, Zod, Blob/shared transport.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không link public vượt quyền; không log thông tin thanh toán; 204/binary không parse envelope sai; dữ liệu tách theo account.
    const response = await apiClient.get<Invoice[]>("/billing/invoices");
    return response.data;
  },
};
