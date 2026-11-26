import { z } from "zod";
import { isVietnamesePhone, VIETNAM_PHONE_MESSAGE } from "@/shared/lib/vietnamPhone";

const timestamp = z.string().datetime({ offset: true });

/** Bước của biên bản bàn giao (Backend: DRAFTING, SIGNING, COMPLETED; CANCELLED khi luật sư hủy; IDENTITY_CHECK chỉ còn ở biên bản cũ, xử lý như SIGNING). */
export const recordStatusSchema = z.enum([
  "DRAFTING",
  "IDENTITY_CHECK",
  "SIGNING",
  "COMPLETED",
  "CANCELLED",
]);
export type RecordStatus = z.infer<typeof recordStatusSchema>;

export const recordAssetSchema = z.object({
  assetId: z.string().uuid(),
  name: z.string(),
  kind: z.string(),
});

export const recordPersonSchema = z.object({
  beneficiaryId: z.string().uuid(),
  fullName: z.string(),
  citizenId: z.string(),
  email: z.string().default(""),
  /** Luật sư sửa, xóa được người này (do mình thêm ở biên bản đang lập, chưa gửi thư mời). */
  canEdit: z.boolean().default(false),
  /** Ngày sinh và số điện thoại chỉ có khi canEdit, để điền sẵn ô sửa. */
  dateOfBirth: z.string().nullable().default(null),
  phone: z.string().default(""),
});

/** Một người nhận trong biên bản: tài sản được nhận, danh tính và chữ ký. */
export const recordRecipientSchema = z.object({
  beneficiaryId: z.string().uuid(),
  fullName: z.string(),
  citizenId: z.string(),
  assets: z.array(recordAssetSchema),
  turnId: z.string().uuid().nullable(),
  turnStatus: z.string(),
  claimed: z.boolean(),
  submissionId: z.string().uuid().nullable(),
  submissionStatus: z.string(),
  identityConfirmedAt: timestamp.nullable(),
  signedAt: timestamp.nullable(),
  /** Luật sư và Người thực thi ký riêng cho từng người nhận. */
  verifierSignedAt: timestamp.nullable().default(null),
  executorSignedAt: timestamp.nullable().default(null),
  /**
   * Người đang xem ký được phần của người nhận này ngay lúc này (Backend quyết theo thứ tự luật sư → Người thực thi →
   * người nhận; FE không tự suy luật).
   */
  canSign: z.boolean().default(false),
  /**
   * Lý do người đang xem chưa ký được phần này; rỗng khi ký được. VERIFIER_NOT_SIGNED, EXECUTOR_NOT_SIGNED,
   * RECIPIENT_NOT_CONFIRMED, IDENTITY_NOT_CONFIRMED, ALREADY_SIGNED, NOT_SIGNING_STEP, RECORD_COMPLETED.
   */
  signBlockedReason: z.string().default(""),
  /** Phần của người nhận này đã đủ chữ ký ba bên (Backend tính). */
  fullySigned: z.boolean().default(false),
  /** Phiếu giao nhận: lúc bên nhận xác nhận đã nhận đủ và lúc Người thực thi ký bên giao. */
  receivedAllAt: timestamp.nullable().default(null),
  receiptExecutorSignedAt: timestamp.nullable().default(null),
  /** Người nhận báo tài sản thiếu hoặc sai. */
  receiptIssueNote: z.string().nullable().default(null),
  receiptIssueAt: timestamp.nullable().default(null),
});

/** Một người nhận trong biên bản phân chia của Chủ tài sản và các tài sản đã gán. */
export const ownerSplitRecipientSchema = z.object({
  beneficiaryId: z.string().uuid(),
  assetIds: z.array(z.string().uuid()),
});

/** Một tệp đính kèm biên bản: chỉ tên và kích thước; nội dung tải qua API riêng có kiểm quyền. */
export const recordFileSchema = z.object({
  id: z.string().uuid(),
  /** DEATH_CERTIFICATE, WILL, OTHER, CLAIM_DOCUMENT (chưa chia loại) hoặc EVIDENCE. */
  kind: z.string().default(""),
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  createdAt: timestamp,
});

/** Kết quả luật sư xét giấy tờ của một yêu cầu nhận tài sản. */
export const claimStatusSchema = z.enum([
  "SUBMITTED",
  "SUPPLEMENT_REQUESTED",
  "ACCEPTED",
  "REJECTED",
]);

/** Một yêu cầu nhận tài sản kèm giấy tờ người nhận đã nộp (chỉ luật sư thấy). */
export const recordClaimSchema = z.object({
  id: z.string().uuid(),
  beneficiaryId: z.string().uuid(),
  fullName: z.string(),
  citizenId: z.string(),
  status: claimStatusSchema,
  note: z.string(),
  reviewReason: z.string().nullable(),
  createdAt: timestamp,
  reviewedAt: timestamp.nullable(),
  files: z.array(recordFileSchema),
});

/**
 * Người nhận do người nộp hồ sơ khai; luật sư phải kiểm lại trước khi dùng. Căn cước và ngày sinh (yyyy-MM-dd) không
 * bắt buộc: hồ sơ cũ và người không khai trả chuỗi rỗng.
 */
export const suggestedRecipientSchema = z.object({
  fullName: z.string(),
  citizenId: z.string().default(""),
  dateOfBirth: z.string().default(""),
  email: z.string(),
  phone: z.string(),
});

export const reportFileSchema = recordFileSchema.extend({
  kind: z.enum(["DEATH_CERTIFICATE", "WILL", "OTHER"]),
});

/** Hồ sơ báo tin đã chấp nhận, gắn với một biên bản. */
export const recordReportSchema = z.object({
  id: z.string().uuid(),
  submitterName: z.string(),
  note: z.string(),
  createdAt: timestamp,
  recipients: z.array(suggestedRecipientSchema),
  files: z.array(reportFileSchema),
});

/** Một chỗ biên bản khác cách chia ban đầu của Chủ tài sản; không có số căn cước. */
export const splitDifferenceSchema = z.object({
  kind: z.enum(["RECIPIENT_ADDED", "RECIPIENT_REMOVED", "ASSET_RECIPIENTS_CHANGED"]),
  beneficiaryId: z.string().nullable().default(null),
  recipientName: z.string().default(""),
  assetId: z.string().nullable().default(null),
  assetName: z.string().default(""),
  ownerRecipientNames: z.array(z.string()).default([]),
  recordRecipientNames: z.array(z.string()).default([]),
});
export type SplitDifference = z.infer<typeof splitDifferenceSchema>;

export const handoverRecordSchema = z.object({
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  vaultName: z.string(),
  ownerName: z.string(),
  status: recordStatusSchema,
  revisionNo: z.number().int().positive(),
  requestedAt: timestamp,
  finalizedAt: timestamp.nullable(),
  // Luật sư xác nhận căn cứ pháp lý khi chốt; dữ liệu cũ có thể thiếu hoặc null.
  legalBasisConfirmedAt: timestamp.nullable().default(null),
  legalBasisConfirmedByUserId: z.string().uuid().nullable().default(null),
  legalBasisConfirmedByName: z.string().default(""),
  /** Kho đã khóa chưa; chỉ khi luật sư chấp nhận giấy tờ thì kho mới khóa và mới chốt được. Dữ liệu cũ coi là đã khóa. */
  vaultLocked: z.boolean().default(true),
  /** Chỗ biên bản khác cách chia ban đầu của Chủ tài sản; rỗng khi giống hoặc khi xem bằng tài khoản người nhận. */
  splitDifferences: z.array(splitDifferenceSchema).default([]),
  /** Lúc luật sư xác nhận việc khác cách chia khi chốt; null khi chưa xác nhận hoặc đã mở lại. */
  splitDeviationConfirmedAt: timestamp.nullable().default(null),
  splitDeviationConfirmedByName: z.string().default(""),
  completedAt: timestamp.nullable(),
  /** Lý do luật sư hủy; null khi chưa hủy. */
  cancelReason: z.string().nullable().default(null),
  verifierName: z.string(),
  executorName: z.string(),
  verifierSignedAt: timestamp.nullable(),
  executorSignedAt: timestamp.nullable(),
  /** Lần luật sư nhắc Người thực thi ký gần nhất; null khi chưa nhắc. Dữ liệu cũ có thể thiếu. */
  executorReminderSentAt: timestamp.nullable().default(null),
  /** Từ lúc này luật sư mới nhắc lại được (lần nhắc + 24 giờ); null khi chưa nhắc. */
  executorRemindAvailableAt: timestamp.nullable().default(null),
  /** Có phần luật sư đã ký mà Người thực thi chưa ký: chỉ khi đó luật sư mới nhắc được Người thực thi. */
  hasPartWaitingForExecutor: z.boolean().default(false),
  recipients: z.array(recordRecipientSchema),
  canSign: z.boolean(),
  availableAssets: z.array(recordAssetSchema),
  availableRecipients: z.array(recordPersonSchema),
  ownerSplit: z.array(ownerSplitRecipientSchema),
  claims: z.array(recordClaimSchema).default([]),
  evidenceFiles: z.array(recordFileSchema).default([]),
  /** Hồ sơ báo tin đã chấp nhận; chỉ luật sư thấy. */
  reports: z.array(recordReportSchema).default([]),
});

export const handoverRecordSummarySchema = z.object({
  id: z.string().uuid(),
  vaultId: z.string().uuid(),
  vaultName: z.string(),
  ownerName: z.string(),
  status: recordStatusSchema,
  recipientCount: z.number().int().nonnegative(),
  requestedAt: timestamp,
});

/** Một dòng "người nhận - tài sản" luật sư gửi lên. */
export const recordLineSchema = z.object({
  beneficiaryId: z.string().uuid(),
  assetId: z.string().uuid(),
});

export type HandoverRecord = z.infer<typeof handoverRecordSchema>;
export type HandoverRecordSummary = z.infer<typeof handoverRecordSummarySchema>;
export type RecordRecipient = z.infer<typeof recordRecipientSchema>;
export type RecordLine = z.infer<typeof recordLineSchema>;
export type RecordFile = z.infer<typeof recordFileSchema>;
export type RecordClaim = z.infer<typeof recordClaimSchema>;
export type ClaimStatus = z.infer<typeof claimStatusSchema>;

/** Tuổi tối thiểu của người nhận; Backend kiểm lại theo cùng luật (đủ 18 tuổi tính đến hôm nay). */
const MIN_RECIPIENT_AGE = 18;

function isoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayText(now: Date = new Date()): string {
  return isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Ngày sinh muộn nhất để đủ 18 tuổi hôm nay; sinh 29/2 mà năm đích không nhuận thì tính 28/2 (giống AddYears ở Backend). */
function latestAdultBirthDate(now: Date = new Date()): string {
  const year = now.getFullYear() - MIN_RECIPIENT_AGE;
  const lastDayOfMonth = new Date(year, now.getMonth() + 1, 0).getDate();
  return isoDate(year, now.getMonth() + 1, Math.min(now.getDate(), lastDayOfMonth));
}

/** Thông tin luật sư nhập khi thêm người nhận mới vào kho. */
export const newRecipientSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ tên.").max(200, "Họ tên tối đa 200 ký tự."),
  citizenId: z
    .string()
    .trim()
    .regex(/^\d{12}$/, "Số căn cước gồm 12 chữ số."),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Vui lòng chọn ngày sinh.")
    .refine((value) => value <= todayText(), "Ngày sinh không được ở tương lai.")
    .refine((value) => value <= latestAdultBirthDate(), "Người nhận phải đủ 18 tuổi."),
  email: z.string().trim().email("Email không hợp lệ.").max(256),
  // Không bắt buộc, nhưng đã nhập thì phải là số di động Việt Nam (giống Backend).
  phone: z
    .string()
    .trim()
    .max(32)
    .optional()
    .refine(
      (text) => text === undefined || text === "" || isVietnamesePhone(text),
      VIETNAM_PHONE_MESSAGE,
    ),
});
export type NewRecipient = z.infer<typeof newRecipientSchema>;
