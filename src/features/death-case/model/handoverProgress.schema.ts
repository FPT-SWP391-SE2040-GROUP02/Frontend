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
  name: z.string(),
  kind: z.enum(["FILE", "TEXT"]),
  downloaded: z.boolean(),
  firstDownloadedAt: timestamp.nullable(),
});

const progressTurnSchema = z.object({
  turnId: z.string().uuid(),
  containerName: z.string(),
  /** Mã hồ sơ người nhận trong kho; các lượt cùng mã là cùng một người. Backend cũ chưa gửi thì null. */
  beneficiaryId: z.string().uuid().nullable().default(null),
  beneficiaryCitizenIdLast4: z.string(),
  /** Họ tên và số điện thoại người nhận: Backend gửi ở lượt còn hiệu lực hoặc đã bàn giao; lượt đã kết thúc là null. */
  beneficiaryFullName: z.string().nullable().default(null),
  beneficiaryPhone: z.string().nullable().default(null),
  status: handoverTurnStatusSchema,
  /** true: lượt do chính tài khoản đang xem nhận; Executor không tự xác nhận được lượt này (BR-122). */
  claimedByYou: z.boolean(),
  /** true: một Executor đã xác nhận đúng người bằng tay thay cho eKYC (BR-122). */
  identityConfirmedByExecutor: z.boolean(),
  invitedAt: timestamp,
  responseDeadline: timestamp,
  /** null: Người thực thi chưa gửi thư mời lần nào (hệ thống không tự gửi). */
  invitationSentAt: timestamp.nullable().default(null),
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
