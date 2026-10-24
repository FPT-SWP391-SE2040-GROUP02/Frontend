import { z } from "zod";

/** Bốn mốc tua của công cụ thử nghiệm, đúng thứ tự hiển thị (DevToolsRules của Backend). */
export const DEV_MILESTONE_KEYS = [
  "CHECKIN_OVERDUE",
  "GRACE_ENDED",
  "OBJECTION_WINDOW_ENDED",
  "SELFIE_DEADLINE_PASSED",
] as const;

export const devMilestoneKeySchema = z.enum(DEV_MILESTONE_KEYS);
export type DevMilestoneKey = z.infer<typeof devMilestoneKeySchema>;

/** AVAILABLE: tua được · PASSED: đã qua mốc · NOT_APPLICABLE: trạng thái hiện tại không có mốc này. */
export const devMilestoneStateSchema = z.enum(["AVAILABLE", "PASSED", "NOT_APPLICABLE"]);

export const devMilestoneSchema = z.object({
  key: devMilestoneKeySchema,
  state: devMilestoneStateSchema,
  note: z.string(),
});
export type DevMilestone = z.infer<typeof devMilestoneSchema>;

/** GET /admin/dev-tools/vaults → DevVaultOptionResponse[] (raw, không envelope). */
export const devVaultOptionSchema = z.object({
  vaultId: z.string().uuid(),
  vaultName: z.string(),
  ownerName: z.string(),
  planStatus: z.string(),
});
export type DevVaultOption = z.infer<typeof devVaultOptionSchema>;
export const devVaultOptionsSchema = z.array(devVaultOptionSchema);

/** DevClockResponse: trạng thái kế hoạch, điểm danh, đồng hồ và bốn mốc. */
export const devClockSchema = z.object({
  vaultId: z.string().uuid(),
  planStatus: z.string(),
  checkInState: z.enum(["ON_TIME", "OVERDUE", "NOT_RUNNING"]),
  clockState: z.enum(["REAL_TIME", "SHIFTED"]),
  milestones: z.array(devMilestoneSchema),
});
export type DevClock = z.infer<typeof devClockSchema>;

/** POST /admin/dev-tools/vaults/{vaultId}/time-travel. */
export const devTimeTravelRequestSchema = z.object({ milestone: devMilestoneKeySchema });
export type DevTimeTravelRequest = z.infer<typeof devTimeTravelRequestSchema>;

/** POST /admin/dev-tools/users/ekyc-reset: email tài khoản cần làm lại eKYC từ đầu. */
export const devEkycResetRequestSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ.").max(256),
});
export type DevEkycResetRequest = z.infer<typeof devEkycResetRequestSchema>;

/** DevEkycResetResponse: chỉ số lượng đã xóa, không có dữ liệu định danh. */
export const devEkycResetSchema = z.object({
  userId: z.string().uuid(),
  email: z.string(),
  verificationsRemoved: z.number().int().nonnegative(),
  consentsRemoved: z.number().int().nonnegative(),
  identityRemoved: z.boolean(),
  faceTemplatesRemoved: z.number().int().nonnegative(),
});
export type DevEkycReset = z.infer<typeof devEkycResetSchema>;

/** DevRewindBeforeEkycResponse: chỉ số lượng đã đổi, không có dữ liệu định danh. */
export const devRewindBeforeEkycSchema = z.object({
  vaultId: z.string().uuid(),
  ownerEmail: z.string(),
  verificationsRemoved: z.number().int().nonnegative(),
  consentsRemoved: z.number().int().nonnegative(),
  identityRemoved: z.boolean(),
  faceTemplatesRemoved: z.number().int().nonnegative(),
  previousTier: z.string(),
  entitlementReset: z.boolean(),
  pendingOrdersCancelled: z.number().int().nonnegative(),
});
export type DevRewindBeforeEkyc = z.infer<typeof devRewindBeforeEkycSchema>;
