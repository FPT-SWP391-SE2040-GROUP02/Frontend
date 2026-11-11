import { z } from "zod";

const timestamp = z.string().datetime({ offset: true });

/** Trạng thái lượt bàn giao theo HandoverTurnStatus của Backend. */
export const handoverTurnStatusSchema = z.enum([
  "INVITED",
  "INITIAL_RESPONSE_EXPIRED",
  "IDENTITY_IN_PROGRESS",
  "READY_TO_ACCEPT",
  "HANDOVER_COMMITTED",
  "DECLINED",
  "DECISION_EXPIRED",
  "CANCELLED",
  "LAPSED",
]);

/** Trạng thái quyền tải theo HandoverGrantStatus của Backend. */
export const handoverGrantStatusSchema = z.enum(["ACTIVE", "BLOCKED", "EXPIRED", "REVOKED"]);

const progressItemSchema = z.object({
  itemId: z.string().uuid(),
  /** Mã tài sản gốc trong kho, để nối với danh sách tài sản của gói. Backend cũ chưa gửi thì null. */
  assetId: z.string().uuid().nullable().default(null),
  name: z.string(),
  kind: z.enum(["FILE", "TEXT"]),
  downloaded: z.boolean(),
  firstDownloadedAt: timestamp.nullable(),
});

const progressTurnSchema = z.object({
  turnId: z.string().uuid(),
  /** Mã gói, để nối lượt với gói trong danh sách tài sản. Backend cũ chưa gửi thì null. */
  containerId: z.string().uuid().nullable().default(null),
  containerName: z.string(),
  /** Mã hồ sơ người nhận trong kho; các lượt cùng mã là cùng một người. Backend cũ chưa gửi thì null. */
  beneficiaryId: z.string().uuid().nullable().default(null),
  beneficiaryCitizenIdLast4: z.string(),
  /** Họ tên và số điện thoại người nhận: Backend gửi ở lượt còn hiệu lực hoặc đã bàn giao; lượt đã kết thúc là null. */
  beneficiaryFullName: z.string().nullable().default(null),
  beneficiaryPhone: z.string().nullable().default(null),
  /** Email người nhận, cùng điều kiện với số điện thoại. Backend cũ chưa gửi thì null. */
  beneficiaryEmail: z.string().nullable().default(null),
  status: handoverTurnStatusSchema,
  /** true: lượt do chính tài khoản đang xem nhận; Executor không tự xác nhận được lượt này (BR-122). */
  claimedByYou: z.boolean(),
  /** true: một Executor đã xác nhận đúng người bằng tay thay cho eKYC (BR-122). */
  identityConfirmedByExecutor: z.boolean(),
  invitedAt: timestamp,
  responseDeadline: timestamp,
  /** Lúc máy chủ email nhận thư mời; null: hệ thống chưa gửi được lời mời (sẽ tự thử lại). */
  invitationSentAt: timestamp.nullable().default(null),
  /** Lúc người nhận ký biên bản đồng ý hoặc văn bản từ chối; null khi chưa có biên bản hoặc chưa ký. Backend cũ chưa gửi thì null. */
  recipientSignedAt: timestamp.nullable().default(null),
  /** Lúc Người xét duyệt ký biên bản của lượt; null khi chưa. Backend cũ chưa gửi thì null. */
  documentApprovedAt: timestamp.nullable().default(null),
  /** Lúc người nhận nhập đúng mã mở gói; null khi chưa nhập hoặc kho không dùng mã. Backend cũ chưa gửi thì null. */
  keyVerifiedAt: timestamp.nullable().default(null),
  claimedAt: timestamp.nullable(),
  decisionDeadline: timestamp.nullable(),
  decidedAt: timestamp.nullable(),
  /** Người nhận đã bấm "Tôi đã nhận đủ" lúc này; Backend cũ chưa gửi thì null. */
  receivedAllAt: timestamp.nullable().default(null),
  grantStatus: handoverGrantStatusSchema.nullable(),
  grantExpiresAt: timestamp.nullable(),
  totalItems: z.number().int().nonnegative(),
  downloadedItems: z.number().int().nonnegative(),
  items: z.array(progressItemSchema),
});

/**
 * HandoverProgressResponse của GET /executor/death-cases/{caseId}/handover-progress.
 * Chỉ có tên/loại tài sản và 4 số cuối CCCD người nhận; không có nội dung tài sản.
 * Họ tên và số điện thoại người nhận chỉ có ở lượt còn hiệu lực hoặc đã bàn giao.
 * Hồ sơ chưa duyệt: handoverStarted = false, turns rỗng, summary toàn 0.
 */
export const handoverProgressSchema = z.object({
  caseId: z.string().uuid(),
  handoverStarted: z.boolean(),
  serverTime: timestamp,
  summary: z.object({
    totalTurns: z.number().int().nonnegative(),
    waitingResponse: z.number().int().nonnegative(),
    inVerification: z.number().int().nonnegative(),
    accepted: z.number().int().nonnegative(),
    declined: z.number().int().nonnegative(),
    ended: z.number().int().nonnegative(),
  }),
  turns: z.array(progressTurnSchema),
});

export type HandoverProgress = z.infer<typeof handoverProgressSchema>;
export type HandoverProgressTurn = z.infer<typeof progressTurnSchema>;

/** Lượt chưa ai nhận: Executor được gửi lại lời mời (BE: INVITED, INITIAL_RESPONSE_EXPIRED). */
/** Lượt còn đang chờ người nhận hoàn tất: Executor được gửi khóa mở gói cho người nhận qua email. */
export const KEY_MAILABLE_TURN_STATUSES: ReadonlyArray<HandoverProgressTurn["status"]> = [
  "INVITED",
  "INITIAL_RESPONSE_EXPIRED",
  "IDENTITY_IN_PROGRESS",
  "READY_TO_ACCEPT",
];

/** SendHandoverKeyResponse của POST .../handover-turns/{turnId}/send-key. */
export const sendHandoverKeySchema = z.object({
  turnId: z.string().uuid(),
  sentAt: timestamp,
});
export type SendHandoverKeyResult = z.infer<typeof sendHandoverKeySchema>;
