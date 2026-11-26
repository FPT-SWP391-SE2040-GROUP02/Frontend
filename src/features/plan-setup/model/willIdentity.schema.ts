import { z } from "zod";

/** Danh tính đầy đủ của Chủ tài sản (đã giải mã) để in trong biên bản phân chia. */
const willOwnerIdentitySchema = z.object({
  fullName: z.string(),
  /** "yyyy-MM-dd". */
  dateOfBirth: z.string(),
  /** Số CCCD đầy đủ 12 số. */
  citizenId: z.string(),
  residenceAddress: z.string(),
});

/** Danh tính đầy đủ của một người nhận, ghép với người nhận trong kế hoạch theo `beneficiaryId`. */
const willRecipientIdentitySchema = z.object({
  beneficiaryId: z.string().min(1),
  fullName: z.string(),
  dateOfBirth: z.string(),
  citizenId: z.string(),
});

/**
 * Phản hồi GET /vaults/{vaultId}/will/identity (chỉ Chủ tài sản, không cache). `owner` null khi chưa có danh tính eKYC gắn
 * với kho. Dữ liệu nhạy cảm: chỉ giữ trong bộ nhớ khi khung xem trước đang mở, không log, không lưu storage.
 */
export const willIdentitySchema = z.object({
  owner: willOwnerIdentitySchema.nullable(),
  recipients: z.array(willRecipientIdentitySchema),
});

export type WillIdentity = z.infer<typeof willIdentitySchema>;
