import { z } from "zod";

/** Hồ sơ pháp lý của Người thực thi hệ thống (BE SystemExecutorLegalVerification). Thiếu số thì Backend trả null. */
const legalVerificationSchema = z.object({
  status: z.enum(["VERIFIED", "UNVERIFIED"]),
  lawyerCardNumber: z.string().nullable(),
  practiceCertificateNumber: z.string().nullable(),
  organization: z.string().nullable(),
  verifiedAt: z.string().nullable(),
});

/** Một Người thực thi hệ thống trong danh bạ (BE SystemExecutorResponse). */
export const systemExecutorSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable().optional(),
  phoneMasked: z.string().nullable().optional(),
  executorRoleTitle: z.string(),
  legalVerification: legalVerificationSchema,
  assignedVaultsCount: z.number().int().nonnegative(),
  isAvailable: z.boolean(),
});
export const systemExecutorListSchema = z.array(systemExecutorSchema);
export type SystemExecutor = z.infer<typeof systemExecutorSchema>;

/** Mã mở gói Chủ kho gửi cho Người thực thi trên hệ thống (BE ExecutorHandoverKeyResponse). */
export const executorHandoverKeySchema = z.object({
  vaultId: z.string().uuid(),
  ownerFullName: z.string(),
  version: z.number().int().positive(),
  shard: z.string().min(1),
  issuedAt: z.string(),
  reissuedAt: z.string().nullable().optional(),
  status: z.string(),
});
export type ExecutorHandoverKey = z.infer<typeof executorHandoverKeySchema>;
