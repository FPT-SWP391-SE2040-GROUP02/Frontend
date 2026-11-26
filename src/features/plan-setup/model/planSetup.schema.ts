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
  /** Phiên bản biên bản phân chia Người thực thi đã xem và ký. */
  confirmedWillVersionNo: z.number().int().nullish(),
  /** Phiên bản Người thực thi không đồng ý. */
  declinedWillVersionNo: z.number().int().nullish(),
});
/**
 * Tài sản được gán cho một người nhận trong biên bản phân chia. Không có nội dung tài sản.
 * `sharedWithCount` là số người nhận tài sản này, tính cả người đang xem; lớn hơn 1 là nhận chung.
 */
const recipientAssetSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  kind: z.enum(["FILE", "TEXT"]),
  sharedWithCount: z.number().int().positive(),
});
/** Người nhận theo từng người. `hasMessage` chỉ cho biết đã viết lời nhắn hay chưa, không có nội dung. */
const recipientSchema = z.object({
  beneficiaryId: z.string().min(1),
  fullName: z.string(),
  hasMessage: z.boolean(),
  assets: z.array(recipientAssetSchema),
});
export type PlanRecipient = z.infer<typeof recipientSchema>;
const unassignedAssetSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: z.enum(["FILE", "TEXT"]),
});
/**
 * Số thay đổi so với bản biên bản phân chia ký gần nhất (chỉ số đếm, không có tên). Gỡ gán có hiệu lực ngay; gán thêm
 * hoặc đổi người nhận chưa được bàn giao cho tới khi Chủ tài sản ký lại.
 */
export const unsignedChangesSchema = z.object({
  addedAssignments: z.number().int().nonnegative().default(0),
  removedAssignments: z.number().int().nonnegative().default(0),
  affectedRecipientCount: z.number().int().nonnegative().default(0),
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
  /** Số tài sản khác nhau đã gán cho ít nhất một người nhận. */
  assignedAssetCount: z.number().int().nonnegative(),
  /** Tài sản chưa gán cho ai — nằm ngoài phạm vi bàn giao. */
  unassignedAssets: z.array(unassignedAssetSchema),
  /** Cảnh báo không chặn activate; chỉ đọc, không disable nút. */
  warnings: z.array(z.string()),
  /** Điều khoản Chủ tài sản thêm vào biên bản phân chia; Backend cũ không có trường này. */
  /** Họ tên và email Chủ tài sản in trong biên bản phân chia. Backend cũ không có hai trường này. */
  ownerFullName: z.string().optional(),
  ownerEmail: z.string().optional(),
  /** Lúc Chủ tài sản ký (kích hoạt). Chỉ tính là đã ký khi kế hoạch không còn DRAFT và trường này có giá trị. */
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
  /** Kế hoạch nháp: Chủ tài sản đã ký, đang chờ Người thực thi xem và ký để có hiệu lực. */
  willAwaitingExecutor: z.boolean().optional(),
  /** Mọi bước khác đã xong nên mời được Người thực thi. */
  canInviteExecutor: z.boolean().optional(),
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
