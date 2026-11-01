import { z } from "zod";
const date = z.string().datetime({ offset: true });
/** Cùng giới hạn độ dài với `InspectExecutorInvitationRequest.Token` phía Backend. */
export const invitationTokenSchema = z.string().min(32).max(512);
export const executorSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["INVITED", "ACCEPTED", "DECLINED", "EXPIRED", "REVOKED", "SUSPENDED"]),
  inviteeEmail: z.string(),
  isBeneficiary: z.boolean(),
  expiresAt: date,
  acceptedAt: date.nullable(),
  invitationSentAt: date.nullable(),
  acceptedScopeVersion: z.string().nullable(),
  etag: z.string().min(1),
});
const containerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(["READY", "DRAFT"]),
  assetCount: z.number().int().nonnegative(),
  designationCount: z.number().int().nonnegative(),
  missingRequirements: z.array(z.string()),
});
const assetOutsideContainerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: z.enum(["FILE", "TEXT"]),
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
  /** Các gói trong kho, kèm lý do chưa sẵn sàng. */
  containers: z.array(containerSchema),
  /** Tài sản chưa thuộc gói nào — nằm ngoài phạm vi bàn giao. */
  assetsOutsideContainer: z.array(assetOutsideContainerSchema),
  /** Cảnh báo không chặn activate; chỉ đọc, không disable nút. */
  warnings: z.array(z.string()),
});
export const executorInfoSchema = z.object({
  expiresAt: date,
  status: z.enum(["INVITED", "ACCEPTED"]),
  scopeVersion: z.string().min(1),
  scopeText: z.string(),
});
export const inviteExecutorSchema = z.object({
  email: z.string().trim().email("Nhập email hợp lệ.").max(254),
  beneficiaryId: z.string().uuid().nullable(),
});
