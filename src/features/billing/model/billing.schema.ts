import { z } from "zod";

/** Hạng dịch vụ trả phí Backend bán (mục 6.18 của hợp đồng API). */
export const billingTierSchema = z.enum(["XS", "XS_MAX"]);
export const billingYearsSchema = z.union([z.literal(1), z.literal(3), z.literal(5)]);

const money = z.number().int().nonnegative();

/** GET /billing/plans: bảng giá hiện hành do Backend công bố. */
export const billingPlansSchema = z.object({
  policyVersion: z.string(),
  currency: z.string(),
  tiers: z.array(
    z.object({
      tier: billingTierSchema,
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

/** Body quote/orders: chỉ gửi lựa chọn, không gửi vaultId, số tiền, loại đơn hay trạng thái (SEC-04, PAY-11). */
export const billingSelectionSchema = z.object({
  tier: billingTierSchema.optional(),
  years: billingYearsSchema.optional(),
  extraSlots: z.number().int().min(0).max(20),
  /** true = gia hạn khi kho còn hạn; kho đã hết hạn Backend tự hiểu là gia hạn. */
  renew: z.boolean().optional(),
});
