import { z } from "zod";

const timestamp = z.string().datetime({ offset: true });
/** Ngày không kèm giờ từ Backend, dạng yyyy-MM-dd. */
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const documentKindSchema = z.enum(["ACCEPT", "DECLINE"]);
export type DocumentKind = z.infer<typeof documentKindSchema>;

export const documentStatusSchema = z.enum(["WAIT_RECIPIENT", "WAIT_VERIFIER", "COMPLETED"]);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

/** Căn lề của một đoạn trong mẫu biên bản. */
export const templateAlignSchema = z.enum(["left", "center", "justify"]);
export type TemplateAlign = z.infer<typeof templateAlignSchema>;

/**
 * Một đoạn của mẫu biên bản: chữ có thể chứa trường dạng {HO_TEN_NGUOI_NHAN} (giao diện và Backend điền từ dữ liệu biên bản),
 * căn lề và đậm hay không.
 */
export const templateParagraphSchema = z.object({
  text: z.string(),
  align: templateAlignSchema,
  bold: z.boolean(),
});
export type TemplateParagraph = z.infer<typeof templateParagraphSchema>;

/**
 * Biên bản đồng ý nhận hoặc văn bản từ chối của một lượt bàn giao (GET .../document, .../documents).
 * Chỉ có thông tin cần cho biên bản: không có số căn cước hay ngày sinh đầy đủ.
 * owner là Phần 1 về Chủ kho, chép từ hồ sơ chứng tử đã duyệt; hồ sơ không bắt buộc ngày mất, số giấy, ngày cấp nên có thể trống.
 */
export const handoverDocumentSchema = z.object({
  id: z.string().uuid(),
  turnId: z.string().uuid(),
  vaultId: z.string().uuid(),
  code: z.string(),
  kind: documentKindSchema,
  status: documentStatusSchema,
  templateVersion: z.string(),
  /** Câu báo về việc xử lý phần tài sản khi có người nhận từ chối (Admin sửa được); Backend cũ không có trường này. */
  declineNotice: z.string().nullish(),
  /** Các đoạn chữ theo mẫu đã ghi lúc tạo biên bản (đúng loại ACCEPT hoặc DECLINE); Backend cũ không có thì dùng chữ cố định. */
  templateParagraphs: z.array(templateParagraphSchema).nullish(),
  containerName: z.string(),
  itemCount: z.number().int().min(0),
  owner: z.object({
    fullName: z.string(),
    dateOfDeath: dateOnly.nullable(),
    certificateNumber: z.string(),
    certificateIssuedOn: dateOnly.nullable(),
    /** Nơi đăng ký khai tử dạng câu, ví dụ "UBND phường Bến Thành, Thành phố Hồ Chí Minh"; rỗng khi hồ sơ không ghi. */
    deathRegistrationPlace: z.string().default(""),
    /** Nơi thường trú theo danh tính eKYC đã xác minh của Chủ kho; rỗng khi không có. */
    residenceAddress: z.string().default(""),
  }),
  recipient: z.object({
    fullName: z.string(),
    birthYear: z.number().int().nullable(),
    citizenId: z.string().default(""),
    citizenIdLast4: z.string(),
    /** Nơi thường trú người nhận khai lúc ký (tạm thời chỉ lưu, chưa hiển thị); rỗng khi chưa ký. */
    residenceAddress: z.string().default(""),
    signedAt: timestamp.nullable(),
  }),
  verifier: z.object({
    signedByName: z.string(),
    checks: z.array(z.boolean()),
    signedAt: timestamp.nullable(),
  }),
  supplementReason: z.string().nullish(),
  /** Chỉ Người xét duyệt thấy: dùng để xem ảnh căn cước và gửi biên bản. */
  submissionId: z.string().uuid().nullish(),
  /** Chỉ Người xét duyệt thấy: lúc người nhận nộp (hoặc nộp lại) hồ sơ mới nhất. */
  submittedAt: timestamp.nullish(),
  /** Chỉ Người xét duyệt thấy: true khi là lần nộp lại sau khi bị yêu cầu bổ sung. */
  resubmitted: z.boolean().default(false),
  /** Chỉ Người xét duyệt thấy: lúc bạn duyệt hồ sơ báo tin của kho. */
  caseApprovedAt: timestamp.nullish(),
  /** Chỉ Người xét duyệt thấy: tổng số người nhận của kho; 0 khi Backend không trả. */
  vaultRecipientTotal: z.number().int().min(0).default(0),
  createdAt: timestamp,
  completedAt: timestamp.nullable(),
});
export type HandoverDocument = z.infer<typeof handoverDocumentSchema>;

/** Số mục Người xét duyệt phải kiểm tra thủ công và tick đủ (khớp HandoverDocumentRules.VerifierCheckCount của Backend). */
export const VERIFIER_CHECK_COUNT = 2;

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  WAIT_RECIPIENT: "Chờ người nhận",
  WAIT_VERIFIER: "Chờ Người xét duyệt",
  COMPLETED: "Hoàn tất",
};

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  ACCEPT: "Biên bản đồng ý nhận",
  DECLINE: "Văn bản từ chối nhận",
};
