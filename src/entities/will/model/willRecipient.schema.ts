import { z } from "zod";

/**
 * Tài sản được gán cho một người nhận trong biên bản phân chia. Không có nội dung tài sản.
 * `sharedWithCount` là số người nhận tài sản này, tính cả người đang xem; lớn hơn 1 là nhận chung.
 */
const recipientAssetSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  kind: z.enum(["FILE", "TEXT"]),
  sharedWithCount: z.number().int().positive(),
});
/** Người nhận theo từng người. `hasMessage` chỉ cho biết đã viết lời nhắn hay chưa, không có nội dung. */
export const recipientSchema = z.object({
  beneficiaryId: z.string().min(1),
  fullName: z.string(),
  hasMessage: z.boolean(),
  assets: z.array(recipientAssetSchema),
});

export type PlanRecipient = z.infer<typeof recipientSchema>;
