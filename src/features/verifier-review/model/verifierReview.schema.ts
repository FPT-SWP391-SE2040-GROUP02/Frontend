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
/** Cảnh báo hệ thống phát hiện trên bản Executor gửi (BE VerifierFlagResponse.Kind). */
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
/** Nhãn tiếng Việt cho mã phần cần bổ sung. */
export const supplementPartLabels: Record<z.infer<typeof supplementPartSchema>, string> = {
  OWNER_FULL_NAME: "Họ tên chủ kho",
  OWNER_CITIZEN_ID: "Số CCCD",
  DATE_OF_DEATH: "Ngày mất",
  CERTIFICATE_NUMBER: "Số giấy chứng tử",
  ISSUED_ON: "Ngày cấp",
  ISSUED_BY: "Nơi cấp",
  FILES: "Trang giấy tờ",
};

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
/** Cảnh báo của bản đang xét. */
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
    .min(1, "Cần nhập ghi chú kiểm tra cảnh báo.")
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
  CHECKIN_AFTER_DEATH: "Chủ kho vẫn điểm danh sau ngày mất ghi trên giấy",
  IDENTITY_MISMATCH: "CCCD trên hồ sơ khác CCCD chủ kho đã xác minh",
};
/** Nhãn cho blocker. */
export const blockerLabels: Record<z.infer<typeof approveBlockerSchema>, string> = {
  NOT_UNDER_REVIEW: "Hồ sơ không ở trạng thái đang xét.",
  NEWER_VERSION_PENDING: "Đang có bản mới chờ xét; chờ Verifier xét bản mới nhất.",
  OWNER_NOT_NOTIFIED: "Owner chưa được thông báo về hồ sơ này.",
  OBJECTION_PERIOD_NOT_OVER: "Đang trong thời gian chờ Owner phản đối (72 giờ).",
  FLAGS_NOT_REVIEWED: "Còn cảnh báo chưa được kiểm tra.",
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

/** Kết luận của Verifier cho lời báo còn sống (BE ObjectionConclusion). */
export const objectionConclusionSchema = z.enum([
  "ALIVE_CONFIRMED",
  "OBJECTION_REJECTED",
  "INSUFFICIENT_EVIDENCE",
]);
/** Lời báo "Tôi còn sống" nhìn từ Verifier (BE ObjectionResponse). */
export const verifierObjectionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["OPEN", "CONCLUDED"]),
  firstReportedAt: timestamp,
  lastReportedAt: timestamp,
  reportCount: z.number().int().nonnegative(),
  selfieDeadlineAt: timestamp,
  selfieWindowOpen: z.boolean(),
  selfiePassed: z.boolean(),
  selfiePassedAt: timestamp.nullable(),
  selfieAttemptsRemaining: z.number().int().nonnegative(),
  verifierDueAt: timestamp.nullable(),
  insufficientEvidenceCount: z.number().int().nonnegative(),
  conclusion: objectionConclusionSchema.nullable(),
  conclusionReason: z.string().nullable(),
  concludedAt: timestamp.nullable(),
  serverTime: timestamp,
});
/** Kết luận lời báo; lý do bắt buộc, tối đa 1000 ký tự (BE ConcludeObjectionRequest). */
export const concludeObjectionRequestSchema = z.object({
  conclusion: objectionConclusionSchema,
  reason: z
    .string()
    .trim()
    .min(1, "Cần nhập lý do kết luận.")
    .max(1000, "Lý do tối đa 1000 ký tự."),
});
export const objectionConclusionLabels: Record<
  z.infer<typeof objectionConclusionSchema>,
  string
> = {
  ALIVE_CONFIRMED: "Xác nhận Owner còn sống",
  OBJECTION_REJECTED: "Bác lời báo",
  INSUFFICIENT_EVIDENCE: "Chưa đủ bằng chứng",
};
/**
 * Kết luận nào còn mở cho lời báo này, theo luật BE mục 6.14:
 * ALIVE_CONFIRMED cần selfie đạt hoặc đã quá 7 ngày; OBJECTION_REJECTED bị chặn khi selfie đã đạt (ALIVE-05).
 * Nút chỉ phản ánh luật; BE vẫn là nơi quyết định.
 */
export function allowedObjectionConclusions(
  objection: z.infer<typeof verifierObjectionSchema>,
): z.infer<typeof objectionConclusionSchema>[] {
  if (objection.status !== "OPEN") return [];
  const options: z.infer<typeof objectionConclusionSchema>[] = [];
  if (objection.selfiePassed || !objection.selfieWindowOpen) options.push("ALIVE_CONFIRMED");
  if (!objection.selfiePassed) options.push("OBJECTION_REJECTED");
  options.push("INSUFFICIENT_EVIDENCE");
  return options;
}
