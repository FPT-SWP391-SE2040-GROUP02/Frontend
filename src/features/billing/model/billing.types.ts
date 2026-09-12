/**
 * @file billing.types.ts
 * @description Định nghĩa các kiểu dữ liệu DTO và Entity cho module Thanh toán SePay VietQR & Gói dịch vụ Két Di Sản.
 */

/**
 * Các cấp độ gói dịch vụ Két Di Sản
 */
export type PlanTier = "FREE" | "FAMILY" | "LIFETIME" | "ENTERPRISE";

/**
 * Trạng thái thanh toán giao dịch VietQR SePay
 */
export type PaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";

/**
 * @description Thông tin một gói dịch vụ Két Di Sản (Pricing Plan)
 */
export interface PricingPlan {
  /** Mã định danh gói */
  id: string;
  /** Cấp độ gói */
  tier: PlanTier;
  /** Tên hiển thị của gói */
  name: string;
  /** Giá tiền (VND) */
  price: number;
  /** Chu kỳ thanh toán (tháng / năm / vĩnh viễn) */
  billingCycle: "monthly" | "yearly" | "lifetime";
  /** Mô tả ngắn về gói */
  description: string;
  /** Danh sách tính năng chính của gói */
  features: string[];
  /** Đánh dấu gói nổi bật / khuyên dùng */
  isPopular?: boolean;
  /** Giới hạn dung lượng lưu trữ (GB) */
  storageLimitGb: number;
  /** Số lượng người thừa kế tối đa */
  maxHeirs: number;
}

/**
 * @description Yêu cầu khởi tạo đơn hàng thanh toán SePay VietQR
 */
export interface CreatePaymentOrderRequest {
  /** Mã gói dịch vụ cần mua */
  planId: string;
  /** Chu kỳ thanh toán được chọn */
  billingCycle: "monthly" | "yearly" | "lifetime";
  /** Mã giảm giá / Voucher (nếu có) */
  voucherCode?: string;
}

/**
 * @description Thông tin đơn hàng & Mã QR chuyển khoản SePay VietQR trả về từ Backend C#
 */
export interface PaymentOrder {
  /** Mã đơn hàng duy nhất của hệ thống */
  orderId: string;
  /** Mã chuyển khoản SePay (nội dung cú pháp chuyển khoản) */
  orderCode: string;
  /** Số tiền cần thanh toán chính xác (VND) */
  amount: number;
  /** Trạng thái giao dịch */
  status: PaymentStatus;
  /** Đường link hình ảnh mã QR VietQR (chuẩn Napas 247) */
  qrCodeUrl: string;
  /** Số tài khoản thụ hưởng */
  accountNumber: string;
  /** Tên chủ tài khoản thụ hưởng */
  accountName: string;
  /** Mã ngân hàng thụ hưởng (VD: 'MB', 'VCB', 'ICB') */
  bankCode: string;
  /** Tên ngân hàng thụ hưởng */
  bankName: string;
  /** Cú pháp chuyển khoản bắt buộc */
  transferContent: string;
  /** Thời điểm hết hạn mã QR (ISO string) */
  expiresAt: string;
  /** Thời gian tạo đơn hàng */
  createdAt: string;
}

/**
 * @description Hóa đơn thanh toán dịch vụ (Invoice)
 */
export interface Invoice {
  /** Mã hóa đơn */
  id: string;
  /** Số hóa đơn (VD: 'INV-2026-0891') */
  invoiceNumber: string;
  /** Tên gói dịch vụ đã mua */
  planName: string;
  /** Số tiền đã thanh toán (VND) */
  amount: number;
  /** Phương thức thanh toán (VD: 'VietQR SePay') */
  paymentMethod: string;
  /** Trạng thái hóa đơn */
  status: "PAID" | "REFUNDED" | "VOID";
  /** Ngày phát hành hóa đơn */
  issuedAt: string;
  /** Đường dẫn tải file PDF hóa đơn */
  pdfUrl?: string;
}

/**
 * @description Cấu trúc Webhook chuẩn nhận từ SePay (SePay Webhook Payload)
 * Tham chiếu: https://developer.sepay.vn/vi#api-docs
 */
export interface SepayWebhookPayload {
  /** ID giao dịch trên SePay */
  id: number;
  /** Tên ngân hàng nhận (VD: 'MBBank', 'Vietcombank') */
  gateway: string;
  /** Thời gian xảy ra giao dịch tại ngân hàng */
  transactionDate: string;
  /** Số tài khoản ngân hàng nhận */
  accountNumber: string;
  /** Tài khoản phụ (nếu có) */
  subAccount: string | null;
  /** Mã thanh toán nhận diện tự động từ nội dung chuyển khoản */
  code: string | null;
  /** Nội dung chuyển khoản thực tế */
  content: string;
  /** Loại giao dịch: 'in' (tiền vào) hoặc 'out' (tiền ra) */
  transferType: "in" | "out";
  /** Số tiền giao dịch */
  transferAmount: number;
  /** Mã tham chiếu đối soát của ngân hàng */
  referenceCode: string;
  /** Số dư lũy kế tài khoản sau giao dịch */
  accumulated: number;
}

/**
 * @description Chi tiết giao dịch ngân hàng trả về từ SePay API v2 (/v2/transactions/list)
 */
export interface SepayTransactionItem {
  id: string;
  bank_brand_name: string;
  account_number: string;
  transaction_date: string;
  amount_in: string;
  amount_out: string;
  accumulated: string;
  code: string | null;
  transaction_content: string;
  reference_number: string;
}

