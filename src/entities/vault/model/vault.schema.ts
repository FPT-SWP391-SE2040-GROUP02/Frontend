import { z } from "zod";

/** Raw VaultResponse; kho, kế hoạch và quyền dịch vụ là các trường riêng. */
export const vaultResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  /** Hướng dẫn Chủ kho để lại cho Executor. Backend cũ không có trường này. */
  executorNote: z.string().nullish(),
  executorNoteUpdatedAt: z.string().datetime({ offset: true }).nullish(),
  /** Điều khoản Chủ kho thêm vào biên bản phân chia, theo thứ tự. Backend cũ không có trường này. */
  status: z.enum(["OPEN", "CLOSED"]),
  closedAt: z.string().datetime({ offset: true }).nullable(),
  planStatus: z.string().min(1),
  planConfigVersion: z.number().int().nonnegative(),
  planActivatedAt: z.string().datetime({ offset: true }).nullable(),
  /** Mã gói: "FREE", "XS", "XS_MAX" hoặc mã gói Admin tạo thêm. */
  serviceTier: z.string().min(1),
  serviceStatus: z.string().min(1),
  serviceExpiresAt: z.string().datetime({ offset: true }).nullable(),
  storageQuotaBytes: z.number().int().nonnegative(),
  storageUsedBytes: z.number().int().nonnegative(),
  storageRemainingBytes: z.number().int().nonnegative(),
  assignedAssetCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }).nullable(),
  etag: z.string().min(1).max(64),
});
