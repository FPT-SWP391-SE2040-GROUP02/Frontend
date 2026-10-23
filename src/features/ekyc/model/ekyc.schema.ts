import { z } from "zod";
const timestamp = z.string().datetime({ offset: true });
/** Mục đích eKYC do BE cấp; schema chấp nhận đủ, FE chỉ nối OWNER_ENROLLMENT và BENEFICIARY_CLAIM. */
export const ekycPurposeSchema = z.enum(["OWNER_ENROLLMENT", "BENEFICIARY_CLAIM", "OWNER_ALIVE"]);
/** Mức khớp danh tính; FE không tự quyết PASSED hoặc MATCHED từ score. */
export const identityMatchSchema = z.enum([
  "NOT_CHECKED",
  "MATCHED",
  "NEEDS_REVIEW",
  "WRONG_PERSON",
]);
/** Raw trạng thái eKYC; score là cosine, không phải phần trăm. */
export const ekycStatusSchema = z.object({
  status: z.enum(["NOT_STARTED", "PENDING", "PASSED", "FAILED"]),
  verificationId: z.string().uuid().nullable(),
  citizenIdLast4: z.string().regex(/^(?:\d{4})?$/),
  faceMatchScore: z.number().nullable(),
  matchThreshold: z.number(),
  spoofCheckPassed: z.boolean().nullable(),
  createdAt: timestamp.nullable(),
  completedAt: timestamp.nullable(),
  purpose: ekycPurposeSchema.nullable(),
  identityMatch: identityMatchSchema,
  backSideChecked: z.boolean(),
});
/**
 * Response POST /ekyc/document-back: trạng thái lượt kèm nơi cư trú đọc từ mặt sau (BR-88). Địa chỉ chỉ có ở
 * phản hồi này để người dùng đối chiếu rồi điền vào bản khai; không có ở GET /ekyc/me và không được lưu.
 * BE cũ chưa trả trường này thì coi như không đọc được.
 */
export const ekycBackSchema = ekycStatusSchema.extend({
  residenceAddress: z.string().default(""),
});
/**
 * OCR chỉ giữ RAM trong form; không persist dữ liệu giấy tờ vào cache/storage.
 * Response mặt trước trả đúng DTO: KHÔNG có purpose/backSideChecked ở đây.
 */
export const ekycDocumentSchema = z.object({
  verificationId: z.string().uuid().nullable(),
  idNumber: z.string(),
  fullName: z.string(),
  dateOfBirth: z.string(),
  residenceAddress: z.string(),
  identityMatch: identityMatchSchema,
  canMatchFace: z.boolean(),
  expiresAt: timestamp.nullable(),
  warnings: z.array(z.string()),
});
/** Chỉ bản người dùng chủ động xác nhận mới được gửi xuống BE; không lưu vào Query cache. */
export const ekycReviewSchema = z.object({
  idNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{12}$/, "CCCD cần đủ 12 chữ số."),
  fullName: z.string().trim().min(1, "Nhập họ tên.").max(200, "Họ tên tối đa 200 ký tự."),
  dateOfBirth: z
    .string()
    .date("Ngày sinh không hợp lệ.")
    .refine(
      (value) => value <= new Date().toISOString().slice(0, 10),
      "Ngày sinh không được ở tương lai.",
    ),
  residenceAddress: z
    .string()
    .trim()
    .min(1, "Nhập địa chỉ cư trú.")
    .max(1000, "Địa chỉ tối đa 1000 ký tự."),
});
/** Ngữ cảnh lượt do BE cấp, kèm bản tự khai sau OCR. */
export const ekycDocumentConfirmationSchema = ekycReviewSchema.extend({
  verificationId: z.string().uuid(),
  purpose: ekycPurposeSchema,
  handoverTurnId: z.string().uuid().optional(),
});

/** Chỉ chuyển định dạng OCR đã biết; dữ liệu khác để trống cho người dùng nhập lại. */
export function ocrDateForInput(value: string): string {
  const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  const date = parts ? `${parts[3]}-${parts[2]}-${parts[1]}` : value.trim();
  return z.string().date().safeParse(date).success ? date : "";
}
/** Response đồng ý thu thập; hiệu lực 30 phút do BE cấp. */
export const ekycConsentResponseSchema = z.object({
  purpose: ekycPurposeSchema,
  noticeVersion: z.string(),
  consentedAt: timestamp,
  expiresAt: timestamp,
});
/** Request đồng ý; chỉ gửi sau khi user chủ động bấm đồng ý. */
export const ekycConsentRequestSchema = z.object({
  purpose: ekycPurposeSchema,
  noticeVersion: z.literal("2026-10-v1"),
});
/** Hành động thử thách camera do BE phát; FE chỉ hiển thị, không tự dò blink/turn. */
export const ekycLivenessActionSchema = z.object({
  key: z.enum(["blink", "left", "right"]),
  label: z.string(),
});
/**
 * Response liveness từ BE: start/frame đều trả cùng schema, chỉ thay đổi `passed`/actions.
 * `expiresInSeconds` chỉ có ở start; frame trả null.
 */
export const ekycLivenessResponseSchema = z.object({
  actions: z.array(ekycLivenessActionSchema),
  completed: z.array(z.string()),
  currentIndex: z.number().int().nonnegative(),
  prompt: z.string(),
  calibrated: z.boolean(),
  challengeCompleted: z.boolean(),
  padPassed: z.boolean(),
  passed: z.boolean(),
  failedReason: z.string(),
  frameHint: z.string(),
  expiresInSeconds: z.number().int().nullable(),
});
/** DTO từ /ekyc/liveness/complete trả EkycStatusResponse, đặt tên alias cho rõ. */
export const ekycLivenessCompleteSchema = ekycStatusSchema;
