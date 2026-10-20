import { z } from "zod";

const timestamp = z.string().datetime({ offset: true });

/** Kết luận Verifier cho báo còn sống (BE `ObjectionConclusion`). */
export const objectionConclusionSchema = z.enum([
  "ALIVE_CONFIRMED",
  "OBJECTION_REJECTED",
  "INSUFFICIENT_EVIDENCE",
]);

/** `ObjectionResponse` của BE, dùng chung cho Owner và Verifier (field giữ nguyên tên wire). */
export const ownerObjectionSchema = z.object({
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

/** `OwnerDeathCaseResponse`: hồ sơ chứng tử nhìn từ Owner, không có nội dung khai báo. */
export const ownerDeathCaseSchema = z.object({
  caseId: z.string().uuid(),
  caseCode: z.string(),
  status: z.string(),
  objectionStartsAt: timestamp.nullable(),
  objectionEndsAt: timestamp.nullable(),
  objection: ownerObjectionSchema.nullable(),
});

export type OwnerObjection = z.infer<typeof ownerObjectionSchema>;
export type OwnerDeathCase = z.infer<typeof ownerDeathCaseSchema>;

/** Ảnh selfie: JPEG/PNG không rỗng, tối đa 8 MiB (khớp BE mục 6.14). */
export const SELFIE_MAX_BYTES = 8 * 1024 * 1024;
export const SELFIE_CONTENT_TYPES = ["image/jpeg", "image/png"] as const;

/** Trả thông báo lỗi tiếng Việt, chuỗi rỗng khi ảnh hợp lệ. */
export function validateSelfie(file: File | null): string {
  if (!file || file.size === 0) return "Chọn ảnh selfie JPEG/PNG không rỗng, tối đa 8 MiB.";
  if (file.size > SELFIE_MAX_BYTES) return "Ảnh selfie vượt quá 8 MiB.";
  if (!(SELFIE_CONTENT_TYPES as readonly string[]).includes(file.type))
    return "Chỉ chấp nhận ảnh JPEG hoặc PNG.";
  return "";
}

export const conclusionLabels: Record<z.infer<typeof objectionConclusionSchema>, string> = {
  ALIVE_CONFIRMED: "Đã xác nhận bạn còn sống",
  OBJECTION_REJECTED: "Lời báo bị bác",
  INSUFFICIENT_EVIDENCE: "Chưa đủ bằng chứng",
};
