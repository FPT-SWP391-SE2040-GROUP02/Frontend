import { z } from "zod";
const date = z.string().datetime({ offset: true });
/** Cùng giới hạn độ dài với `InspectExecutorInvitationRequest.Token` phía Backend. */
export const invitationTokenSchema = z.string().min(32).max(512);
export const executorSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["INVITED", "ACCEPTED", "DECLINED", "EXPIRED", "REVOKED", "SUSPENDED"]),
  inviteeEmail: z.string(),
  expiresAt: date,
  acceptedAt: date.nullable(),
  invitationSentAt: date.nullable(),
  acceptedScopeVersion: z.string().nullable(),
  etag: z.string().min(1),
  accountExists: z.boolean().optional(),
  emailUndeliverable: z.boolean().optional(),
  /** Họ tên trong tài khoản đã liên kết; null khi chưa có tài khoản. Backend cũ không có trường này. */
  fullName: z.string().nullable().optional(),
});
/** Gói của một người nhận trong biên bản phân chia. Không có nội dung tài sản. */
const recipientContainerSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  assetCount: z.number().int().nonnegative(),
  status: z.enum(["READY", "DRAFT"]),
});
/** Người nhận theo từng người. `hasMessage` chỉ cho biết đã viết lời nhắn hay chưa, không có nội dung. */
const recipientSchema = z.object({
  beneficiaryId: z.string().min(1),
  fullName: z.string(),
  hasMessage: z.boolean(),
  containers: z.array(recipientContainerSchema),
});
export type PlanRecipient = z.infer<typeof recipientSchema>;
const containerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.enum(["READY", "DRAFT"]),
  assetCount: z.number().int().nonnegative(),
  designationCount: z.number().int().nonnegative(),
  missingRequirements: z.array(z.string()),
});
const assetOutsideContainerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: z.enum(["FILE", "TEXT"]),
});
/**
 * Số thay đổi so với bản biên bản phân chia ký gần nhất (chỉ số đếm, không có tên). Xóa có hiệu lực ngay; thêm gói, thêm tài sản,
 * thêm hoặc đổi người nhận chưa được bàn giao cho tới khi Chủ kho ký lại.
 */
export const unsignedChangesSchema = z.object({
  removedContainers: z.number().int().nonnegative().default(0),
  addedContainers: z.number().int().nonnegative().default(0),
  removedAssets: z.number().int().nonnegative().default(0),
  addedAssets: z.number().int().nonnegative().default(0),
  removedRecipients: z.number().int().nonnegative().default(0),
  addedRecipients: z.number().int().nonnegative().default(0),
  changedRecipientCount: z.number().int().nonnegative().default(0),
});
export type UnsignedChanges = z.infer<typeof unsignedChangesSchema>;
export const planSetupSchema = z.object({
  planStatus: z.string(),
  configVersion: z.number().int().positive(),
  canActivate: z.boolean(),
  missingRequirements: z.array(z.string()),
  policyVersion: z.string().min(1),
  policyText: z.string(),
  executorScopeVersion: z.string(),
  executorScopeText: z.string(),
  executors: z.array(executorSchema),
  /** Các gói trong kho, kèm lý do chưa sẵn sàng. */
  containers: z.array(containerSchema),
  /** Tài sản chưa thuộc gói nào — nằm ngoài phạm vi bàn giao. */
  assetsOutsideContainer: z.array(assetOutsideContainerSchema),
  /** Cảnh báo không chặn activate; chỉ đọc, không disable nút. */
  warnings: z.array(z.string()),
  /** Điều khoản Chủ kho thêm vào biên bản phân chia; Backend cũ không có trường này. */
  /** Họ tên và email Chủ kho in trong biên bản phân chia. Backend cũ không có hai trường này. */
  ownerFullName: z.string().optional(),
  ownerEmail: z.string().optional(),
  /** Lúc Chủ kho ký (kích hoạt). Chỉ tính là đã ký khi kế hoạch không còn DRAFT và trường này có giá trị. */
  activatedAt: date.nullable().optional(),
  /** Người nhận theo từng người; thiếu nghĩa là Backend cũ chưa trả, giao diện dùng câu chung. */
  recipients: z.array(recipientSchema).optional(),
  /** Số phiên bản biên bản phân chia đã ký gần nhất; null hoặc thiếu khi chưa có phiên bản. Backend cũ không có trường này. */
  willVersion: z.number().int().nullable().optional(),
  /** Lúc ký phiên bản gần nhất. */
  willSignedAt: date.nullable().optional(),
  /** Kế hoạch đang chạy mà cấu hình khác bản ký gần nhất. */
  hasUnsignedChanges: z.boolean().optional(),
  unsignedChanges: unsignedChangesSchema.nullable().optional(),
});
export const executorInfoSchema = z.object({
  expiresAt: date,
  status: z.enum(["INVITED", "ACCEPTED"]),
  scopeVersion: z.string().min(1),
  scopeText: z.string(),
});
export const inviteExecutorSchema = z.object({
  email: z.string().trim().email("Nhập email hợp lệ.").max(254),
});
