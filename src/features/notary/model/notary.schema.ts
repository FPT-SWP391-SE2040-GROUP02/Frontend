import { z } from "zod";

/**
 * @file notary.schema.ts
 * @description Zod Schemas cho quy trình thẩm định hồ sơ của Công chứng viên.
 * Bắt buộc tuân thủ ma trận 4 tiêu chí kiểm toán và giải trình tối thiểu 20 ký tự khi từ chối.
 */

export const NOTARY_REJECTION_REASONS = {
  UNCLEAR_DOCUMENT: "ERR_NOTARY_UNCLEAR_DOCUMENT",
  IDENTITY_MISMATCH: "ERR_NOTARY_IDENTITY_MISMATCH",
  UNAUTHORIZED_ISSUER: "ERR_NOTARY_UNAUTHORIZED_ISSUER",
  COURT_DECREE_NOT_FINAL: "ERR_NOTARY_COURT_DECREE_NOT_FINAL",
  TAMPER_SUSPECTED: "ERR_NOTARY_TAMPER_SUSPECTED",
} as const;

export const REJECTION_REASON_LABELS: Record<string, string> = {
  [NOTARY_REJECTION_REASONS.UNCLEAR_DOCUMENT]:
    "Bản scan giấy tờ bị mờ, mất góc hoặc không đọc được con dấu mộc đỏ. Vui lòng quét lại bản rõ nét hơn.",
  [NOTARY_REJECTION_REASONS.IDENTITY_MISMATCH]:
    "Số CCCD hoặc họ tên trên giấy tờ không trùng khớp với thông tin chủ kho đã đăng ký.",
  [NOTARY_REJECTION_REASONS.UNAUTHORIZED_ISSUER]:
    "Giấy tờ không đủ thẩm quyền pháp lý (Ví dụ: Giấy báo tử của bệnh viện chưa làm thủ tục khai tử tại UBND).",
  [NOTARY_REJECTION_REASONS.COURT_DECREE_NOT_FINAL]:
    "Quyết định/Bản án của Tòa án chưa có hiệu lực pháp luật hoặc đang trong thời hạn kháng cáo.",
  [NOTARY_REJECTION_REASONS.TAMPER_SUSPECTED]:
    "Chứng từ có dấu hiệu chỉnh sửa, tẩy xóa hoặc can thiệp bằng phần mềm đồ họa.",
};

/**
 * Schema phê duyệt hồ sơ: Bắt buộc tích đủ 4 tiêu chí kiểm toán và nhập mã PIN 6 số
 */
export const notaryApproveSchema = z.object({
  claimId: z.string().min(1, "Thiếu mã định danh hồ sơ"),
  notaryPinCode: z
    .string()
    .length(6, "Mã PIN chữ ký số công chứng viên phải gồm đúng 6 chữ số")
    .regex(/^\d+$/, "Mã PIN chỉ được chứa các ký tự số"),
  checkCriteria: z.object({
    isDocumentValid: z.boolean().refine((val) => val === true, {
      message: "Bắt buộc xác nhận tính hợp pháp của chứng từ",
    }),
    isIdentityMatched: z.boolean().refine((val) => val === true, {
      message: "Bắt buộc xác nhận thông tin CCCD hoàn toàn trùng khớp",
    }),
    isManifestIntegrityVerified: z.boolean().refine((val) => val === true, {
      message: "Bắt buộc xác nhận tính toàn vẹn của mã băm manifest",
    }),
    isExecutorAuthorized: z.boolean().refine((val) => val === true, {
      message: "Bắt buộc xác nhận tư cách hợp pháp của Người thi hành",
    }),
  }),
  notaryNotes: z.string().optional(),
});

export type NotaryApproveFormValues = z.infer<typeof notaryApproveSchema>;

/**
 * Schema từ chối hồ sơ: Bắt buộc chọn mã lỗi và nhập tối thiểu 20 ký tự giải trình
 */
export const notaryRejectSchema = z.object({
  claimId: z.string().min(1, "Thiếu mã định danh hồ sơ"),
  rejectionReasonCode: z.string().min(1, "Vui lòng chọn lý do từ chối chính"),
  notaryNotes: z
    .string()
    .min(20, "Văn bản hướng dẫn sửa đổi bổ sung phải có độ dài tối thiểu 20 ký tự giải trình cụ thể")
    .max(1000, "Văn bản giải trình không được vượt quá 1000 ký tự"),
});

export type NotaryRejectFormValues = z.infer<typeof notaryRejectSchema>;
