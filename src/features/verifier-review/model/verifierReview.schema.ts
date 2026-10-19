import { z } from "zod";
const timestamp = z.string().datetime({ offset: true });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
/** Status hồ sơ mà Verifier được giao (BE VerifierDeathCaseSummaryResponse). */
export const verifierCaseStatusSchema = z.enum([
  "UNDER_REVIEW",
  "SUPPLEMENT_REQUIRED",
  "APPROVED_FOR_HANDOVER",
  "REJECTED",
  "SUSPENDED",
]);
/** Cờ phát hiện trên bản Executor gửi (BE VerifierFlagResponse.Kind). */
export const verifierFlagKindSchema = z.enum(["CHECKIN_AFTER_DEATH", "IDENTITY_MISMATCH"]);
/** Quyết định Verifier đã ra (BE VerifierDecisionResponse.Kind). */
export const verifierDecisionKindSchema = z.enum(["SUPPLEMENT_REQUESTED", "REJECTED", "APPROVED"]);
/** Trạng thái thông báo Owner (BE DeathCaseNoticeResponse.Status). */
export const ownerNoticeStatusSchema = z.enum(["PENDING", "DELIVERED", "FAILED", "CANCELLED"]);
/** Mã phần cần bổ sung (DEATH-01) mà FE truyền trong RequestSupplement. */
export const supplementPartSchema = z.enum([
  "OWNER_FULL_NAME",
  "OWNER_CITIZEN_ID",
  "DATE_OF_DEATH",
  "CERTIFICATE_NUMBER",
  "ISSUED_ON",
  "ISSUED_BY",
  "FILES",
]);
/** Lý do chặn duyệt (BE VerifierDeathCaseResponse.ApproveBlockers). */
export const approveBlockerSchema = z.enum([
  "NOT_UNDER_REVIEW",
  "NEWER_VERSION_PENDING",
  "OWNER_NOT_NOTIFIED",
  "OBJECTION_PERIOD_NOT_OVER",
  "FLAGS_NOT_REVIEWED",
  "VERIFIER_CONFLICT",
]);
/** Metadata một trang giấy chứng tử (chỉ metadata, không có nội dung). */
export const verifierFileSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int(),
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  uploadedAt: timestamp,
});
/** Snapshot dòng danh sách hồ sơ giao cho Verifier (BE VerifierDeathCaseSummaryResponse). */
export const verifierCaseSummarySchema = z.object({
  id: z.string().uuid(),
  status: verifierCaseStatusSchema,
  reviewVersionNo: z.number().int().nullable(),
  ownerCitizenIdLast4: z.string().nullable(),
  dateOfDeath: date.nullable(),
  submittedAt: timestamp.nullable(),
  assignedAt: timestamp,
  dueAt: timestamp,
  objectionEndsAt: timestamp.nullable(),
  unreviewedFlagCount: z.number().int().nonnegative(),
  closedAt: timestamp.nullable(),
  /** Có giá trị = Executor bổ sung quá hạn 7 ngày; null/thiếu = chưa quá hạn hoặc đã gửi lại (BE mục 6.12). */
  supplementOverdueAt: timestamp.nullable().optional(),
});
/** Bản Executor gửi gần nhất mà Verifier đang xét (đã giải mã, có CCCD đầy đủ Owner). */
export const verifierReviewVersionSchema = z.object({
  versionNo: z.number().int().positive(),
  ownerFullName: z.string().nullable(),
  ownerCitizenId: z.string().nullable(),
  ownerCitizenIdLast4: z.string().nullable(),
  dateOfDeath: date.nullable(),
  certificateNumber: z.string().nullable(),
  issuedOn: date.nullable(),
  issuedBy: z.string().nullable(),
  submittedAt: timestamp.nullable(),
  files: z.array(verifierFileSchema),
});
/** Bản cũ (không giải mã, chỉ 4 số cuối CCCD). */
export const verifierOlderVersionSchema = z.object({
  versionNo: z.number().int().positive(),
  ownerCitizenIdLast4: z.string().nullable(),
  dateOfDeath: date.nullable(),
  submittedAt: timestamp.nullable(),
  files: z.array(verifierFileSchema),
});
/** Cờ của bản đang xét. */
export const verifierFlagSchema = z.object({
  id: z.string().uuid(),
  kind: verifierFlagKindSchema,
  detail: z.string(),
  createdAt: timestamp,
  reviewedAt: timestamp.nullable(),
  reviewNote: z.string().nullable(),
});
/** Quyết định đã ra. */
export const verifierDecisionSchema = z.object({
  kind: verifierDecisionKindSchema,
  versionNo: z.number().int().positive(),
  reason: z.string(),
  requestedParts: z.array(supplementPartSchema),
  decidedAt: timestamp,
});
/** Thông báo Owner. */
export const ownerNoticeSchema = z
  .object({ status: ownerNoticeStatusSchema, deliveredAt: timestamp.nullable() })
  .nullable();
/** Phân công Verifier. */
export const verifierAssignmentSchema = z.object({
  assignedAt: timestamp,
  dueAt: timestamp,
});
/** Hồ sơ trước đó cùng kho bị từ chối. */
export const verifierPreviousCaseSchema = z
  .object({
    id: z.string().uuid(),
    closedAt: timestamp.nullable(),
    rejectReason: z.string().nullable(),
  })
  .nullable();
/** Kết quả mở bàn giao khi duyệt lần đầu (chỉ có ở response duyệt). */
export const verifierHandoverSchema = z
  .object({
    turnCount: z.number().int().nonnegative(),
    invitationsSent: z.number().int().nonnegative(),
    invitationsFailed: z.number().int().nonnegative(),
  })
  .nullable();
/** Chi tiết hồ sơ Verifier được giao. */
export const verifierCaseDetailSchema = z.object({
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  status: verifierCaseStatusSchema,
  etag: z.string().min(1).max(64),
  createdAt: timestamp,
  firstSubmittedAt: timestamp.nullable(),
  closedAt: timestamp.nullable(),
  reviewVersion: verifierReviewVersionSchema,
  versions: z.array(verifierOlderVersionSchema),
  flags: z.array(verifierFlagSchema),
  decisions: z.array(verifierDecisionSchema),
  ownerNotice: ownerNoticeSchema,
  objectionEndsAt: timestamp.nullable(),
  assignment: verifierAssignmentSchema,
  canApprove: z.boolean(),
  approveBlockers: z.array(approveBlockerSchema),
  previousCase: verifierPreviousCaseSchema,
  handover: verifierHandoverSchema,
  /** Có giá trị = Executor bổ sung quá hạn 7 ngày; null/thiếu = chưa quá hạn hoặc đã gửi lại (BE mục 6.12). */
  supplementOverdueAt: timestamp.nullable().optional(),
});
/** Review một cờ. */
export const reviewFlagRequestSchema = z.object({
  etag: z.string().min(1).max(64),
  note: z
    .string()
    .trim()
    .min(1, "Cần nhập ghi chú xem xét cờ.")
    .max(1000, "Ghi chú tối đa 1000 ký tự."),
});
/** Yêu cầu Executor bổ sung. */
export const requestSupplementRequestSchema = z.object({
  etag: z.string().min(1).max(64),
  reason: z
    .string()
    .trim()
    .min(1, "Cần nhập lý do yêu cầu bổ sung.")
    .max(1000, "Lý do tối đa 1000 ký tự."),
  requestedParts: z.array(supplementPartSchema).min(1, "Chọn ít nhất một phần cần bổ sung."),
});
/** Duyệt hồ sơ và mở bàn giao. */
export const approveCaseRequestSchema = z.object({
  etag: z.string().min(1).max(64),
  reason: z.string().trim().min(1, "Cần nhập lý do duyệt.").max(1000, "Lý do tối đa 1000 ký tự."),
});
/** Từ chối hồ sơ. */
export const rejectCaseRequestSchema = z.object({
  etag: z.string().min(1).max(64),
  reason: z.string().trim().min(1, "Cần nhập lý do từ chối.").max(1000, "Lý do tối đa 1000 ký tự."),
});
/** Nhãn tiếng Việt cho status hồ sơ. */
export const caseStatusLabels: Record<z.infer<typeof verifierCaseStatusSchema>, string> = {
  UNDER_REVIEW: "Đang xét",
  SUPPLEMENT_REQUIRED: "Yêu cầu bổ sung",
  APPROVED_FOR_HANDOVER: "Đã duyệt, mở bàn giao",
  REJECTED: "Đã từ chối",
  SUSPENDED: "Tạm dừng",
};
/** Nhãn cho cờ. */
export const flagLabels: Record<z.infer<typeof verifierFlagKindSchema>, string> = {
  CHECKIN_AFTER_DEATH: "Có lượt điểm danh sau ngày mất",
  IDENTITY_MISMATCH: "Thông tin nhân thân chưa khớp",
};
/** Nhãn cho blocker. */
export const blockerLabels: Record<z.infer<typeof approveBlockerSchema>, string> = {
  NOT_UNDER_REVIEW: "Hồ sơ không ở trạng thái đang xét.",
  NEWER_VERSION_PENDING: "Đang có bản mới chờ xét; chờ Verifier xét bản mới nhất.",
  OWNER_NOT_NOTIFIED: "Owner chưa được thông báo về hồ sơ này.",
  OBJECTION_PERIOD_NOT_OVER: "Đang trong thời gian chờ Owner phản đối (72 giờ).",
  FLAGS_NOT_REVIEWED: "Còn cờ chưa được xem xét.",
  VERIFIER_CONFLICT:
    "Bạn có quan hệ với kho này nên chỉ được xem, không được ra quyết định trên hồ sơ.",
};
/** Nhãn cho trạng thái báo Owner; `DELIVERED` được ghép thêm `deliveredAt` ở UI. */
export const ownerNoticeLabels: Record<z.infer<typeof ownerNoticeStatusSchema>, string> = {
  PENDING: "Đang chờ gửi",
  DELIVERED: "Đã gửi",
  FAILED: "Gửi lỗi",
  CANCELLED: "Đã hủy",
};
/** Nhãn cho decision. */
export const decisionLabels: Record<z.infer<typeof verifierDecisionKindSchema>, string> = {
  SUPPLEMENT_REQUESTED: "Yêu cầu bổ sung",
  REJECTED: "Từ chối",
  APPROVED: "Duyệt mở bàn giao",
};
