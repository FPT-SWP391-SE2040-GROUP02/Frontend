import { z } from "zod";
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
/** Response chỉ có bốn số cuối CCCD; parse loại bỏ full citizenId ngoài contract. */
export const beneficiaryResponseSchema = z.object({
  id: z.string().uuid(),
  citizenIdLast4: z.string().regex(/^\d{4}$/),
  fullName: z.string(),
  dateOfBirth: date,
  email: z.string().nullable(),
  phone: z.string().nullable(),
  minorAcknowledgedAt: z.string().datetime({ offset: true }).nullable(),
  containerIds: z.array(z.string().uuid()),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }).nullable(),
  etag: z.string().min(1).max(64),

  isExisting: z.boolean().optional(),
});
const fullNameRule = z
  .string()
  .min(2, "Họ và tên phải có ít nhất 2 ký tự.")
  .max(200, "Họ tên tối đa 200 ký tự.")
  .regex(/^[\p{L}\s]+$/u, "Họ và tên chỉ được chứa chữ cái và khoảng trắng.");

/** Shape CreateBeneficiaryRequest; họ tên, ngày sinh, email bắt buộc. */
export const createBeneficiarySchema = z.object({
  fullName: fullNameRule,
  dateOfBirth: date,
  email: z
    .string()
    .min(1, "Email là bắt buộc.")
    .max(254, "Email tối đa 254 ký tự.")
    .email("Email không hợp lệ."),
  phone: z.string().max(20).nullable().optional(),
  citizenId: z.string().regex(/\S/).max(32),
});
/** PUT không cho đổi CCCD; null giữ nguyên. */
export const updateBeneficiarySchema = z.object({
  fullName: fullNameRule.nullable().optional(),
  dateOfBirth: date.nullable().optional(),
  email: z.string().max(254).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  etag: z.string().min(1).max(64),
});
