import { z } from "zod";

/** GET /admin/dev-tools/vaults → DevVaultOptionResponse[] (raw, không envelope). */
export const devVaultOptionSchema = z.object({
  vaultId: z.string().uuid(),
  vaultName: z.string(),
  ownerName: z.string(),
  planStatus: z.string(),
});
export type DevVaultOption = z.infer<typeof devVaultOptionSchema>;
export const devVaultOptionsSchema = z.array(devVaultOptionSchema);

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
  vaultRemoved: z.boolean(),
  filesRemoved: z.number().int().nonnegative(),
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

/** GET /admin/dev-tools/ekyc-threshold → ngưỡng so khớp khuôn mặt eKYC đang chạy (DevEkycThresholdResponse). */
export const devEkycThresholdSchema = z.object({
  currentThreshold: z.number(),
  defaultThreshold: z.number(),
  min: z.number(),
  max: z.number(),
});
export type DevEkycThreshold = z.infer<typeof devEkycThresholdSchema>;

/** PUT /admin/dev-tools/ekyc-threshold: ngưỡng mới trong dải an toàn [min; max]. */
export const devUpdateEkycThresholdRequestSchema = z.object({
  threshold: z.number(),
});
export type DevUpdateEkycThresholdRequest = z.infer<typeof devUpdateEkycThresholdRequestSchema>;

/** GET/PUT /admin/dev-tools/ekyc-pause → eKYC có đang tạm ngừng không (DevEkycPauseResponse). */
export const devEkycPauseSchema = z.object({
  paused: z.boolean(),
});
export type DevEkycPause = z.infer<typeof devEkycPauseSchema>;
