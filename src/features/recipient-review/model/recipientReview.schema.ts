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
 * Chi tiết một hồ sơ người nhận: thông tin người nhận khai và thông tin Chủ tài sản đã khai cạnh nhau, kèm kết quả đối chiếu,
 * để người xét duyệt so với ảnh căn cước.
 */
export const recipientSubmissionDetailSchema = recipientSubmissionSummarySchema.extend({
  status: z.enum(["SUBMITTED", "SUPPLEMENT_REQUESTED", "APPROVED", "SUPERSEDED"]),
  nameMatches: z.boolean(),
  citizenIdMatches: z.boolean(),
  dateOfBirthMatches: z.boolean(),
  citizenId: z.string(),
  /** Thông tin người nhận đã gõ lúc nộp; hồ sơ nộp trước khi Backend lưu các trường này thì trống. */
  claimedFullName: z.string().nullish(),
  claimedDateOfBirth: z.string().nullish(),
  /** Thông tin Chủ tài sản đã khai cho người nhận này; trống khi Backend không đọc được. */
  declaredFullName: z.string().nullish(),
  declaredCitizenId: z.string().nullish(),
  declaredDateOfBirth: z.string().nullish(),
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
  SUBMITTED: "Chờ kiểm",
  SUPPLEMENT_REQUESTED: "Đã yêu cầu làm lại",
  APPROVED: "Đã xác nhận",
  SUPERSEDED: "Đã được nộp lại",
};

export const SUBMISSION_KIND_LABELS: Record<z.infer<typeof submissionKind>, string> = {
  ACCEPT: "Chấp nhận",
  DECLINE: "Từ chối",
};
