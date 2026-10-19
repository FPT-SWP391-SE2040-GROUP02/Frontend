import { z } from "zod";

/**
 * @description Zod Schema kiểm tra hợp lệ khi khởi tạo đơn hàng thanh toán SePay
 */
export const createPaymentOrderSchema = z.object({
  planId: z.string().min(1, "Vui lòng chọn gói dịch vụ"),
  billingCycle: z.enum(["monthly", "yearly", "lifetime"], {
    errorMap: () => ({ message: "Chu kỳ thanh toán không hợp lệ" }),
  }),
  voucherCode: z
    .string()
    .trim()
    .toUpperCase()
    .max(20, "Mã giảm giá không vượt quá 20 ký tự")
    .optional()
    .or(z.literal("")),
});

/**
 * Kiểu dữ liệu TypeScript suy diễn từ createPaymentOrderSchema
 */
export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;

/**
 * @description Zod Schema kiểm tra mã voucher giảm giá
 */
export const voucherSchema = z.object({
  code: z
    .string()
    .min(3, "Mã giảm giá tối thiểu 3 ký tự")
    .max(20, "Mã giảm giá tối đa 20 ký tự")
    .regex(/^[A-Z0-9_-]+$/, "Mã chỉ được chứa chữ hoa, số và dấu gạch nối"),
});

export type VoucherInput = z.infer<typeof voucherSchema>;
