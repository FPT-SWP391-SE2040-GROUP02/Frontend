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
  /** Phiên bản biên bản phân chia Chủ kho ký gần nhất; null khi chưa ký. */
  willVersionNo: z.number().int().positive().nullish(),
  willSignedAt: z.string().datetime({ offset: true }).nullish(),
  acceptedAt: timestamp.nullish(),
  /** Biên bản bàn giao của kho; null khi chưa có yêu cầu nhận tài sản. */
  handoverRecordId: z.string().uuid().nullish(),
  /** DRAFTING, SIGNING, COMPLETED (IDENTITY_CHECK chỉ còn ở biên bản cũ); rỗng khi chưa có yêu cầu nhận tài sản. */
  handoverRecordStatus: z.string().optional().default(""),
});

/**
 * Một người nhận nhìn từ Người thực thi: họ tên, số CCCD và các tài sản được gán (tên, loại, dung lượng);
 * không có nội dung. `sharedWithCount` lớn hơn 1 là tài sản nhận chung với người khác.
 */
export const executorRecipientSchema = z.object({
  beneficiaryId: z.string().uuid(),
  fullName: z.string().nullish(),
  citizenId: z.string(),
  assets: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      kind: z.enum(["FILE", "TEXT"]),
      sizeBytes: z.number().int().nonnegative(),
      sharedWithCount: z.number().int().positive(),
    }),
  ),
});
export type ExecutorRecipient = z.infer<typeof executorRecipientSchema>;
/** Hồ sơ chỉ có CCCD che, không có nội dung file hoặc Verifier được giao. */
export type ExecutorVault = z.infer<typeof executorVaultSchema>;
