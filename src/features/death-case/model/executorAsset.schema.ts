import { z } from "zod";

/** Một tài sản trong danh sách Người thực thi xem: chỉ thông tin mô tả, không có nội dung. */
export const executorAssetSchema = z.object({
  id: z.string().uuid(),
  kind: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  fileName: z.string().nullish(),
  contentType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export const executorAssetPageSchema = z.object({
  items: z.array(executorAssetSchema),
  totalCount: z.number().int().nonnegative(),
});

export type ExecutorAsset = z.infer<typeof executorAssetSchema>;
