import { z } from "zod";
const timestamp = z.string().datetime({ offset: true });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const executorVaultSchema = z.object({
  vaultId: z.string().uuid(),
  ownerFullName: z.string(),
  planStatus: z.string(),
  /** Hướng dẫn Chủ kho để lại cho Executor; xem được trước khi hồ sơ được duyệt. Backend cũ không có trường này. */
  executorNote: z.string().nullish(),
  executorNoteUpdatedAt: timestamp.nullish(),
  checkInOverdue: z.boolean(),
  openDeathCaseId: z.string().uuid().nullable(),
  /** Hồ sơ bị từ chối gần nhất của kho, để Executor xem lại lý do. Backend cũ không có trường này. */
  lastRejectedDeathCaseId: z.string().uuid().nullish(),
  /** Lần Chủ kho TỰ điểm danh gần nhất (điểm danh thay không tính); null khi chưa từng. Backend cũ không có trường này. */
  lastOwnerCheckInAt: timestamp.nullish(),
  /** Số lần điểm danh thay liên tiếp tối đa (Admin đặt) và số lượt còn lại. Backend cũ không có các trường này. */
  proxyCheckInLimit: z.number().int().nonnegative().nullish(),
  proxyCheckInsUsed: z.number().int().nonnegative().nullish(),
  proxyCheckInsLeft: z.number().int().nonnegative().nullish(),
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

/** Kết quả Executor điểm danh thay chủ kho: kế hoạch về ACTIVE và có kỳ điểm danh mới. */
export const executorCheckInSchema = z.object({
  vaultId: z.string().uuid(),
  planStatus: z.string(),
  checkedInAt: timestamp,
  nextCheckInDueAt: timestamp,
  graceEndsAt: timestamp,
  proxyCheckInLimit: z.number().int().nonnegative().nullish(),
  proxyCheckInsLeft: z.number().int().nonnegative().nullish(),
});

export type ExecutorVault = z.infer<typeof executorVaultSchema>;
export type DeathCase = z.infer<typeof deathCaseSchema>;
