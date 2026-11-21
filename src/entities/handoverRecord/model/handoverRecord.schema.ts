import { z } from "zod";

const timestamp = z.string().datetime({ offset: true });

/** Bước của biên bản bàn giao (Backend: DRAFTING, IDENTITY_CHECK, SIGNING, COMPLETED; CANCELLED khi Chủ kho hủy). */
export const recordStatusSchema = z.enum([
  "DRAFTING",
  "IDENTITY_CHECK",
  "SIGNING",
  "COMPLETED",
  "CANCELLED",
]);
export type RecordStatus = z.infer<typeof recordStatusSchema>;

export const recordAssetSchema = z.object({
  assetId: z.string().uuid(),
  name: z.string(),
  kind: z.string(),
});

export const recordPersonSchema = z.object({
  beneficiaryId: z.string().uuid(),
  fullName: z.string(),
  citizenIdLast4: z.string(),
});

/** Một người nhận trong biên bản: tài sản được nhận, danh tính và chữ ký. */
export const recordRecipientSchema = z.object({
  beneficiaryId: z.string().uuid(),
  fullName: z.string(),
  citizenIdLast4: z.string(),
  assets: z.array(recordAssetSchema),
  turnId: z.string().uuid().nullable(),
  turnStatus: z.string(),
  claimed: z.boolean(),
  submissionId: z.string().uuid().nullable(),
  submissionStatus: z.string(),
  identityConfirmedAt: timestamp.nullable(),
  signedAt: timestamp.nullable(),
});

/** Một gói trong file phân chia của Chủ kho. */
export const ownerSplitPackageSchema = z.object({
  packageName: z.string(),
  beneficiaryIds: z.array(z.string().uuid()),
  assetIds: z.array(z.string().uuid()),
});

/** Một tệp đính kèm biên bản: chỉ tên và kích thước; nội dung tải qua API riêng có kiểm quyền. */
export const recordFileSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  createdAt: timestamp,
});

/** Kết quả luật sư xét giấy tờ của một yêu cầu nhận tài sản. */
export const claimStatusSchema = z.enum([
  "SUBMITTED",
  "SUPPLEMENT_REQUESTED",
  "ACCEPTED",
  "REJECTED",
]);

/** Một yêu cầu nhận tài sản kèm giấy tờ người nhận đã nộp (chỉ luật sư thấy). */
export const recordClaimSchema = z.object({
  id: z.string().uuid(),
  beneficiaryId: z.string().uuid(),
  fullName: z.string(),
  citizenIdLast4: z.string(),
  status: claimStatusSchema,
  note: z.string(),
  reviewReason: z.string().nullable(),
  createdAt: timestamp,
  reviewedAt: timestamp.nullable(),
  files: z.array(recordFileSchema),
});

export const handoverRecordSchema = z.object({
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  vaultName: z.string(),
  ownerName: z.string(),
  status: recordStatusSchema,
  revisionNo: z.number().int().positive(),
  requestedAt: timestamp,
  finalizedAt: timestamp.nullable(),
  completedAt: timestamp.nullable(),
  verifierName: z.string(),
  executorName: z.string(),
  verifierSignedAt: timestamp.nullable(),
  executorSignedAt: timestamp.nullable(),
  recipients: z.array(recordRecipientSchema),
  canSign: z.boolean(),
  availableAssets: z.array(recordAssetSchema),
  availableRecipients: z.array(recordPersonSchema),
  ownerSplit: z.array(ownerSplitPackageSchema),
  claims: z.array(recordClaimSchema).default([]),
  evidenceFiles: z.array(recordFileSchema).default([]),
});

export const handoverRecordSummarySchema = z.object({
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  vaultName: z.string(),
  ownerName: z.string(),
  status: recordStatusSchema,
  recipientCount: z.number().int().nonnegative(),
  requestedAt: timestamp,
});

/** Một dòng "người nhận - tài sản" luật sư gửi lên. */
export const recordLineSchema = z.object({
  beneficiaryId: z.string().uuid(),
  assetId: z.string().uuid(),
});

export type HandoverRecord = z.infer<typeof handoverRecordSchema>;
export type HandoverRecordSummary = z.infer<typeof handoverRecordSummarySchema>;
export type RecordRecipient = z.infer<typeof recordRecipientSchema>;
export type RecordLine = z.infer<typeof recordLineSchema>;
export type RecordFile = z.infer<typeof recordFileSchema>;
export type RecordClaim = z.infer<typeof recordClaimSchema>;
export type ClaimStatus = z.infer<typeof claimStatusSchema>;

/** Thông tin luật sư nhập khi thêm người nhận mới vào kho. */
export const newRecipientSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên.").max(200, "Họ tên tối đa 200 ký tự."),
  citizenId: z
    .string()
    .trim()
    .regex(/^\d{12}$/, "Số căn cước gồm 12 chữ số."),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Vui lòng chọn ngày sinh."),
  email: z.string().trim().email("Email không hợp lệ.").max(256),
  phone: z.string().trim().max(32).optional(),
});
export type NewRecipient = z.infer<typeof newRecipientSchema>;
