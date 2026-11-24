import { z } from "zod";
import {
  claimStatusSchema,
  reportFileSchema,
  suggestedRecipientSchema,
} from "./handoverRecord.schema";

const timestamp = z.string().datetime({ offset: true });

/** Hồ sơ báo tin nhìn từ người nộp: không có thông tin kho. */
export const myReportSchema = z.object({
  id: z.string().uuid(),
  deceasedFullName: z.string(),
  status: claimStatusSchema,
  dateOfDeath: z.string().nullable(),
  cancelledByOwner: z.boolean(),
  cancelReason: z.string().nullable(),
  note: z.string(),
  reviewReason: z.string().nullable(),
  createdAt: timestamp,
  reviewedAt: timestamp.nullable(),
  recipients: z.array(suggestedRecipientSchema),
  files: z.array(reportFileSchema),
});

/** Hồ sơ báo tin nhìn từ luật sư được giao. */
export const verifierReportSchema = myReportSchema.extend({
  deceasedCitizenId: z.string(),
  submitterName: z.string(),
  submitterEmail: z.string(),
  submitterPhone: z.string(),
  vaultFound: z.boolean(),
  ownerName: z.string(),
  nameMatches: z.boolean(),
  ownerLastActiveAt: timestamp.nullable(),
  /** Chủ kho còn hoạt động sau ngày mất đã khai. */
  activeAfterDeath: z.boolean(),
  acceptNote: z.string().nullable(),
  recordId: z.string().uuid().nullable(),
});

export type SuggestedRecipient = z.infer<typeof suggestedRecipientSchema>;
export type ReportFile = z.infer<typeof reportFileSchema>;
export type MyReport = z.infer<typeof myReportSchema>;
export type VerifierReport = z.infer<typeof verifierReportSchema>;
