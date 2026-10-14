import { z } from "zod";

/** Raw VaultResponse; kho, kế hoạch và quyền dịch vụ là các trường riêng. */
export const vaultResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(["OPEN", "CLOSED"]),
  closedAt: z.string().datetime({ offset: true }).nullable(),
  planStatus: z.string().min(1),
  planConfigVersion: z.number().int().nonnegative(),
  planActivatedAt: z.string().datetime({ offset: true }).nullable(),
  serviceTier: z.enum(["FREE", "XS", "XS_MAX"]),
  serviceStatus: z.string().min(1),
  serviceExpiresAt: z.string().datetime({ offset: true }).nullable(),
  storageQuotaBytes: z.number().int().nonnegative(),
  storageUsedBytes: z.number().int().nonnegative(),
  storageRemainingBytes: z.number().int().nonnegative(),
  beneficiarySlots: z.number().int().nonnegative(),
  includedBeneficiarySlots: z.number().int().nonnegative(),
  extraBeneficiarySlots: z.number().int().nonnegative(),
  usedBeneficiarySlots: z.number().int().nonnegative(),
  activeContainerCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }).nullable(),
  etag: z.string().min(1).max(64),
});
