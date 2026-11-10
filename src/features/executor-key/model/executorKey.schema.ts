import { z } from "zod";

/** Trạng thái mã mở gói của kho (BE ExecutorKeyStatusResponse). Không bao giờ có mã gốc hay hash. */
export const executorKeyStatusSchema = z.object({
  hasKey: z.boolean(),
  version: z.number().int().nonnegative(),
  issuedAt: z.string().nullable().optional(),
  reissuedAt: z.string().nullable().optional(),
  /** false khi kế hoạch đã khóa (có báo tin): không cấp mới hay cấp lại được. */
  canIssue: z.boolean(),
});
export type ExecutorKeyStatus = z.infer<typeof executorKeyStatusSchema>;

/** Kết quả cấp mã: mã gốc chỉ có trong response này, không đọc lại được. */
export const executorKeyIssuedSchema = executorKeyStatusSchema.extend({
  shard: z.string().min(1),
});
export type ExecutorKeyIssued = z.infer<typeof executorKeyIssuedSchema>;
