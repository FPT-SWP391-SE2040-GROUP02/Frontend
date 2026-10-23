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
  isMinor: z.boolean(),
  minorAcknowledgedAt: z.string().datetime({ offset: true }).nullable(),
  containerIds: z.array(z.string().uuid()),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }).nullable(),
  etag: z.string().min(1).max(64),

  isExisting: z.boolean().optional(),
});
const contact = {
  fullName: z.string().max(200),
  dateOfBirth: date,
  email: z.string().max(254).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
};
/** Shape CreateBeneficiaryRequest; tuổi/liên hệ/dedup do service Backend kiểm. */
export const createBeneficiarySchema = z.object({
  ...contact,
  fullName: contact.fullName.regex(/\S/),
  citizenId: z.string().regex(/\S/).max(32),
});
/** PUT không cho đổi CCCD; null giữ nguyên, contact chuỗi rỗng xóa. */
export const updateBeneficiarySchema = z.object({
  ...contact,
  fullName: contact.fullName.nullable().optional(),
  dateOfBirth: date.nullable().optional(),
  etag: z.string().min(1).max(64),
});
