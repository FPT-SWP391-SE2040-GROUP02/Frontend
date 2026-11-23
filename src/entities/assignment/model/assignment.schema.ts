import { z } from "zod";

/** Một dòng gán: tài sản này được gán cho người nhận này. Một tài sản gán cho nhiều người thì nhận chung. */
export const assignmentSchema = z.object({
  id: z.string().uuid(),
  assetId: z.string().uuid(),
  beneficiaryId: z.string().uuid(),
  createdAt: z.string().datetime({ offset: true }),
});

/** GET /vaults/{vaultId}/assignments và kết quả PUT/DELETE: mảng thuần, không phân trang. */
export const assignmentListSchema = z.array(assignmentSchema);

/** Body PUT .../assets/{assetId}/assignments: danh sách người nhận sau cùng của tài sản (rỗng là gỡ hết). */
export const setAssetRecipientsSchema = z.object({
  beneficiaryIds: z.array(z.string().uuid()).max(200),
  confirmPlanDeactivation: z.boolean().optional(),
});

export type Assignment = z.infer<typeof assignmentSchema>;
export type SetAssetRecipientsRequest = z.infer<typeof setAssetRecipientsSchema>;
