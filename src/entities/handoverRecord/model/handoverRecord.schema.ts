import { z } from "zod";

const timestamp = z.string().datetime({ offset: true });

/** Bốn bước của biên bản bàn giao (Backend: DRAFTING, IDENTITY_CHECK, SIGNING, COMPLETED). */
export const recordStatusSchema = z.enum(["DRAFTING", "IDENTITY_CHECK", "SIGNING", "COMPLETED"]);
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
