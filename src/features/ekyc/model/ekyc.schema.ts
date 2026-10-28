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
  referenceCrop: z.string().nullable().optional(),
  selfieCrop: z.string().nullable().optional(),
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
/** Kiểm tra chuỗi ngày sinh (hỗ trợ cả DD/MM/YYYY cho người dùng và YYYY-MM-DD cho ISO). */
export function isValidDateOfBirth(value: string): boolean {
  const trimmed = value.trim();
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (dmy) {
    const d = parseInt(dmy[1], 10);
    const m = parseInt(dmy[2], 10);
    const y = parseInt(dmy[3], 10);
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return false;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return dt <= today;
  }
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (ymd) {
    const y = parseInt(ymd[1], 10);
    const m = parseInt(ymd[2], 10);
    const d = parseInt(ymd[3], 10);
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return false;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return dt <= today;
  }
  return false;
}

/** Chuyển DD/MM/YYYY hoặc YYYY-MM-DD sang ISO YYYY-MM-DD để gửi xuống Backend. */
export function formatToIsoDate(value: string): string {
  const trimmed = value.trim();
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return trimmed;
}

/** Chuyển định dạng bất kỳ (DD/MM/YYYY hoặc YYYY-MM-DD) sang DD/MM/YYYY để hiển thị. */
export function formatToDdMmYyyy(value: string): string {
  const trimmed = value.trim();
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (dmy) return trimmed;
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;
  return trimmed;
}

/** Chỉ bản người dùng chủ động xác nhận mới được gửi xuống BE; không lưu vào Query cache. */
export const ekycReviewSchema = z.object({
  idNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{12}$/, "CCCD cần đủ 12 chữ số."),
  fullName: z.string().trim().min(1, "Nhập họ tên.").max(200, "Họ tên tối đa 200 ký tự."),
  dateOfBirth: z
    .string()
    .trim()
    .refine(isValidDateOfBirth, "Ngày sinh không hợp lệ hoặc ở tương lai (định dạng DD/MM/YYYY)."),
  residenceAddress: z
    .string()
    .trim()
    .min(1, "Nhập địa chỉ cư trú.")
    .max(1000, "Địa chỉ tối đa 1000 ký tự."),
});
/** Ngữ cảnh lượt do BE cấp, kèm bản tự khai sau OCR đã chuyển sang ISO YYYY-MM-DD. */
export const ekycDocumentConfirmationSchema = z.object({
  idNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{12}$/),
  fullName: z.string().trim().min(1).max(200),
  dateOfBirth: z
    .string()
    .date("Ngày sinh không hợp lệ.")
    .refine(
      (value) => value <= new Date().toISOString().slice(0, 10),
      "Ngày sinh không được ở tương lai.",
    ),
  residenceAddress: z.string().trim().min(1).max(1000),
  verificationId: z.string().uuid(),
  purpose: ekycPurposeSchema,
  handoverTurnId: z.string().uuid().optional(),
});

/** Chỉ chuyển định dạng OCR đã biết sang DD/MM/YYYY; dữ liệu khác để trống cho người dùng nhập lại. */
export function ocrDateForInput(value: string): string {
  const trimmed = value.trim();
  const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (parts) {
    const d = parseInt(parts[1], 10);
    const m = parseInt(parts[2], 10);
    const y = parseInt(parts[3], 10);
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) {
      return trimmed;
    }
    return "";
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) {
    const y = parseInt(iso[1], 10);
    const m = parseInt(iso[2], 10);
    const d = parseInt(iso[3], 10);
    const dt = new Date(y, m - 1, d);
    if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) {
      return `${iso[3]}/${iso[2]}/${iso[1]}`;
    }
    return "";
  }
  return "";
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
