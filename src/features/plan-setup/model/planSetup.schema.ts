import { z } from "zod";
const date = z.string().datetime({ offset: true });
export const executorSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["PRIMARY", "BACKUP"]),
  status: z.enum(["INVITED", "ACCEPTED", "DECLINED", "EXPIRED", "REVOKED", "SUSPENDED"]),
  inviteeEmail: z.string(),
  isBeneficiary: z.boolean(),
  expiresAt: date,
  acceptedAt: date.nullable(),
  invitationSentAt: date.nullable(),
  acceptedScopeVersion: z.string().nullable(),
  etag: z.string().min(1),
});
export const planSetupSchema = z.object({
  planStatus: z.string(),
  configVersion: z.number().int().positive(),
  canActivate: z.boolean(),
  missingRequirements: z.array(z.string()),
  policyVersion: z.string().min(1),
  policyText: z.string(),
  executorScopeVersion: z.string(),
  executorScopeText: z.string(),
  executors: z.array(executorSchema),
});
export const executorInfoSchema = z.object({
  role: z.enum(["PRIMARY", "BACKUP"]),
  expiresAt: date,
  status: z.enum(["INVITED", "ACCEPTED"]),
  scopeVersion: z.string().min(1),
  scopeText: z.string(),
});
export const inviteExecutorSchema = z.object({
  email: z.string().trim().email("Nhập email hợp lệ.").max(254),
  role: z.enum(["PRIMARY", "BACKUP"]),
  beneficiaryId: z.string().uuid().nullable(),
});
