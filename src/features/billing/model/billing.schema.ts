import { z } from "zod";
import { paginatedListSchema } from "@/shared/api/pagination.schema";

/** Hạng dịch vụ trả phí Backend bán (mục 6.18 của hợp đồng API). */
export const billingTierSchema = z.string().min(1).max(32);
/** Số năm của một kỳ bán; Admin cấu hình danh sách kỳ (1 đến 10 năm), nên không còn cố định 1, 3, 5. */
export const billingYearsSchema = z.number().int().min(1).max(10);

const money = z.number().int().nonnegative();

/** GET /billing/plans: bảng giá hiện hành do Backend công bố. */
export const billingPlansSchema = z.object({
  policyVersion: z.string(),
  currency: z.string(),
  tiers: z.array(
    z.object({
      tier: billingTierSchema,
      /** false = Admin đã tạm ngừng mở bán hạng này; thiếu trường (Backend cũ) thì coi là đang bán. */
      onSale: z.boolean().optional(),
      /** Tên, phụ đề và thứ tự do Admin đặt; Backend cũ không gửi thì dùng bảng tên mặc định. */
      name: z.string().optional(),
      subtitle: z.string().optional(),
      order: z.number().int().optional(),
      /** true = Admin đã xóa gói: không vẽ thẻ gói, chỉ dùng để so thứ tự với gói đang dùng. */
      hidden: z.boolean().optional(),
      /** Các dòng mô tả tính năng do Admin viết; rỗng hoặc thiếu thì dùng mô tả mặc định. */
      features: z.array(z.string()).optional(),
      storageQuotaBytes: z.number().int().positive(),
      includedBeneficiarySlots: z.number().int().nonnegative(),
      prices: z.array(
        z.object({
          years: billingYearsSchema,
          amount: money,
          serviceDays: z.number().int().positive(),
        }),
      ),
    }),
  ),
  extraSlot: z.object({
    pricePerYear: money,
    maxPerOrder: z.number().int().positive(),
  }),
  notice: z.string(),
  /** Mô tả tính năng của gói Free do Admin viết; rỗng hoặc thiếu thì dùng mô tả mặc định. */
  freeFeatures: z.array(z.string()).optional(),
  /** Hạn mức gói Free do Admin đặt; Backend cũ không gửi thì dùng số mặc định của FE. */
  free: z
    .object({
      storageQuotaBytes: z.number().int().nonnegative(),
      includedBeneficiarySlots: z.number().int().nonnegative(),
    })
    .optional(),
});

/** Loại đơn do Backend tự xác định từ quyền dịch vụ của kho. */
export const billingKindSchema = z.enum(["PURCHASE", "ADDON", "UPGRADE", "RENEWAL"]);

/** POST /billing/quote: báo giá không ghi DB. Số tiền chỉ hiển thị, không bao giờ gửi lại. */
export const billingQuoteSchema = z.object({
  kind: billingKindSchema,
  tier: billingTierSchema,
  years: z.number().int().nullable(),
  extraSlots: z.number().int().nonnegative(),
  tierAmount: money,
  slotAmount: money,
  totalAmount: money,
  currency: z.string(),
  storageQuotaBytes: z.number().int().positive(),
  includedBeneficiarySlots: z.number().int().nonnegative(),
  beneficiarySlots: z.number().int().nonnegative(),
  serviceDays: z.number().int().nullable(),
  serviceStartsAt: z.string().nullable(),
  serviceExpiresAt: z.string().nullable(),
  policyVersion: z.string(),
  notice: z.string(),
  serverTime: z.string(),
});

export const paymentOrderStatusSchema = z.enum(["PENDING", "PAID", "EXPIRED", "CANCELLED"]);

/** Đơn thanh toán: đã gồm mã QR và thông tin chuyển khoản khi còn PENDING. */
export const paymentOrderSchema = z.object({
  id: z.string().uuid(),
  kind: billingKindSchema,
  status: paymentOrderStatusSchema,
  tier: billingTierSchema,
  years: z.number().int().nullable(),
  extraSlots: z.number().int().nonnegative(),
  tierAmount: money,
  slotAmount: money,
  totalAmount: money,
  currency: z.string(),
  storageQuotaBytes: z.number().int().positive(),
  includedBeneficiarySlots: z.number().int().nonnegative(),
  paymentCode: z.string(),
  transferContent: z.string(),
  bank: z.object({
    bankCode: z.string(),
    accountNumber: z.string(),
    accountName: z.string(),
  }),
  qrImageUrl: z.string().nullable(),
  expiresAt: z.string(),
  createdAt: z.string(),
  paidAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  serverTime: z.string(),
  notice: z.string(),
});

/** Một dòng lịch sử thanh toán (GET /billing/orders): không có ngân hàng hay mã QR. */
export const paymentOrderSummarySchema = z.object({
  id: z.string().uuid(),
  kind: billingKindSchema,
  status: paymentOrderStatusSchema,
  tier: billingTierSchema,
  years: z.number().int().nullable(),
  extraSlots: z.number().int().nonnegative(),
  totalAmount: money,
  currency: z.string(),
  paymentCode: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  paidAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
});

export const paymentOrderPageSchema = paginatedListSchema(paymentOrderSummarySchema);

/** Body quote/orders: chỉ gửi lựa chọn, không gửi vaultId, số tiền, loại đơn hay trạng thái (SEC-04, PAY-11). */
export const billingSelectionSchema = z.object({
  tier: billingTierSchema.optional(),
  years: billingYearsSchema.optional(),
  /** Trần thật do Backend quyết theo cấu hình Admin (tối đa 100); ở đây chỉ chặn giá trị vô lý. */
  extraSlots: z.number().int().min(0).max(100),
  /** true = gia hạn khi kho còn hạn; kho đã hết hạn Backend tự hiểu là gia hạn. */
  renew: z.boolean().optional(),
});
