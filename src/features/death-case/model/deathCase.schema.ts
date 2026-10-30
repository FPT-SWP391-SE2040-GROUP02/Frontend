import { z } from "zod";
const timestamp = z.string().datetime({ offset: true });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const executorVaultSchema = z.object({
  vaultId: z.string().uuid(),
  ownerFullName: z.string(),
  planStatus: z.string(),
  checkInOverdue: z.boolean(),
  openDeathCaseId: z.string().uuid().nullable(),
  /** Hồ sơ bị từ chối gần nhất của kho, để Executor xem lại lý do. Backend cũ không có trường này. */
  lastRejectedDeathCaseId: z.string().uuid().nullish(),
});
/** Hồ sơ chỉ có CCCD che, không có nội dung file hoặc Verifier được giao. */
export const deathCaseSchema = z.object({
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  status: z.enum([
    "DRAFT",
    "UNDER_REVIEW",
    "SUPPLEMENT_REQUIRED",
    "APPROVED_FOR_HANDOVER",
    "REJECTED",
    "SUSPENDED",
  ]),
  currentVersion: z.object({
    versionNo: z.number().int().positive(),
    isDraft: z.boolean(),
    ownerFullName: z.string().nullable(),
    ownerCitizenIdLast4: z.string().nullable(),
    dateOfDeath: date.nullable(),
    certificateNumber: z.string().nullable(),
    issuedOn: date.nullable(),
    issuedBy: z.string().nullable(),
    files: z.array(
      z.object({
        id: z.string().uuid(),
        position: z.number().int(),
        fileName: z.string(),
        contentType: z.string(),
        sizeBytes: z.number().int().nonnegative(),
        uploadedAt: timestamp,
      }),
    ),
    submittedAt: timestamp.nullable(),
  }),
  reviewVersionNo: z.number().int().nullable(),
  missingRequirements: z.array(z.string()),
  /** Có khi SUPPLEMENT_REQUIRED; không chứa thông tin Verifier. Fixture cũ không có trường này. */
  supplementRequest: z
    .object({
      versionNo: z.number().int().positive(),
      reason: z.string(),
      requestedParts: z.array(z.string()),
      requestedAt: timestamp,
      dueAt: timestamp.nullish(),
      overdue: z.boolean().optional(),
    })
    .nullish(),
  /** Có khi REJECTED: lý do Verifier nhập để Executor mở hồ sơ mới. */
  rejectReason: z.string().nullish(),
  ownerNotice: z
    .object({
      status: z.enum(["PENDING", "DELIVERED", "FAILED", "CANCELLED"]),
      deliveredAt: timestamp.nullable(),
    })
    .nullable(),
  objectionEndsAt: timestamp.nullable(),
  createdAt: timestamp,
  updatedAt: timestamp.nullable(),
  etag: z.string().min(1).max(64),
});
export const deathDraftSchema = z.object({
  etag: z.string().min(1).max(64),
  ownerFullName: z.string().max(200),
  ownerCitizenId: z.string().max(32).nullable().optional(),
  dateOfDeath: date.nullable().optional(),
  certificateNumber: z.string().max(100),
  issuedOn: date.nullable().optional(),
  issuedBy: z.string().max(200),
});

export type ExecutorVault = z.infer<typeof executorVaultSchema>;
export type DeathCase = z.infer<typeof deathCaseSchema>;
