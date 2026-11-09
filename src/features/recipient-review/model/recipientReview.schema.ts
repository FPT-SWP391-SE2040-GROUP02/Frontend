import { z } from "zod";

const submissionKind = z.enum(["ACCEPT", "DECLINE"]);

/** Một dòng trong hàng chờ duyệt hồ sơ người nhận (GET /verifier/handover-submissions). */
export const recipientSubmissionSummarySchema = z.object({
  id: z.string().uuid(),
  turnId: z.string().uuid(),
  containerName: z.string(),
  kind: submissionKind,
  allMatch: z.boolean(),
  submittedAt: z.string(),
});
export type RecipientSubmissionSummary = z.infer<typeof recipientSubmissionSummarySchema>;

/**
 * Chi tiết một hồ sơ người nhận. Backend không trả họ tên, ngày sinh hay số căn cước đầy đủ: chỉ kết quả đối chiếu
 * với thông tin Chủ kho đã khai và 4 số cuối để người xét duyệt đối chiếu với ảnh.
 */
export const recipientSubmissionDetailSchema = recipientSubmissionSummarySchema.extend({
  status: z.enum(["SUBMITTED", "SUPPLEMENT_REQUESTED", "APPROVED", "SUPERSEDED"]),
  nameMatches: z.boolean(),
  citizenIdMatches: z.boolean(),
  dateOfBirthMatches: z.boolean(),
  citizenIdLast4: z.string(),
  acknowledged: z.boolean(),
  voluntaryDecline: z.boolean(),
  supplementReason: z.string().nullish(),
  itemCount: z.number().int().min(0),
  canApprove: z.boolean(),
  canRequestSupplement: z.boolean(),
});
export type RecipientSubmissionDetail = z.infer<typeof recipientSubmissionDetailSchema>;

/** Body yêu cầu bổ sung: lý do bắt buộc, tối đa 1000 ký tự. */
export const supplementRequestSchema = z.object({
  reason: z.string().trim().min(1, "Vui lòng nhập lý do.").max(1000, "Lý do tối đa 1000 ký tự."),
});

export const SUBMISSION_STATUS_LABELS: Record<RecipientSubmissionDetail["status"], string> = {
  SUBMITTED: "Chờ duyệt",
  SUPPLEMENT_REQUESTED: "Đã yêu cầu bổ sung",
  APPROVED: "Đã duyệt",
  SUPERSEDED: "Đã được nộp lại",
};

export const SUBMISSION_KIND_LABELS: Record<z.infer<typeof submissionKind>, string> = {
  ACCEPT: "Chấp nhận",
  DECLINE: "Từ chối",
};
