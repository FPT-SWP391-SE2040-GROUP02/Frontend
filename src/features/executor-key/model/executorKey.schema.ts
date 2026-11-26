import { z } from "zod";

/**
 * Trạng thái mã nhận của kho (BE ExecutorKeyStatusResponse). Không bao giờ có mã gốc hay hash:
 * hệ thống tự giữ mã, Chủ tài sản chỉ thấy bản số mấy và đổi mã mới được.
 */
export const executorKeyStatusSchema = z.object({
  hasKey: z.boolean(),
  version: z.number().int().nonnegative(),
  issuedAt: z.string().nullable().optional(),
  reissuedAt: z.string().nullable().optional(),
  /** false khi kế hoạch đã khóa (có báo tin): không đổi mã được. */
  canIssue: z.boolean(),
});
export type ExecutorKeyStatus = z.infer<typeof executorKeyStatusSchema>;
