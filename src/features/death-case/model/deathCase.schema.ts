import { z } from "zod";
const timestamp = z.string().datetime({ offset: true });
export const executorVaultSchema = z.object({
  vaultId: z.string().uuid(),
  ownerFullName: z.string(),
  planStatus: z.string(),
  /** Hướng dẫn Chủ kho để lại cho Người thực thi; null khi Chủ kho chưa viết. */
  executorNote: z.string().nullish(),
  executorNoteUpdatedAt: timestamp.nullish(),
  /** Lúc tài khoản chấp nhận lời mời làm Người thực thi của kho; dữ liệu cũ không có thì null. */
  acceptedAt: timestamp.nullish(),
  /** Biên bản bàn giao của kho; null khi chưa mở bàn giao. */
  handoverRecordId: z.string().uuid().nullish(),
  /** DRAFTING, IDENTITY_CHECK, SIGNING, COMPLETED; rỗng khi chưa mở bàn giao. */
  handoverRecordStatus: z.string().optional().default(""),
});

/** Một gói bàn giao nhìn từ Người thực thi: chỉ tên gói, người nhận, tên và loại tài sản; không có nội dung. */
export const executorPackageSchema = z.object({
  containerId: z.string().uuid(),
  containerName: z.string(),
  recipients: z.array(
    z.object({
      fullName: z.string().nullish(),
      citizenIdLast4: z.string(),
    }),
  ),
  assets: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      kind: z.enum(["FILE", "TEXT"]),
      sizeBytes: z.number().int().nonnegative(),
    }),
  ),
});
export type ExecutorPackage = z.infer<typeof executorPackageSchema>;
/** Hồ sơ chỉ có CCCD che, không có nội dung file hoặc Verifier được giao. */
export type ExecutorVault = z.infer<typeof executorVaultSchema>;
