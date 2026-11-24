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
  /** Tiêu đề lượt lúc mở bàn giao (tên trường giữ lại từ thời còn gói tài sản). */
  containerName: z.string(),
  /** Mã hồ sơ người nhận trong kho; các lượt cùng mã là cùng một người. Backend cũ chưa gửi thì null. */
  beneficiaryId: z.string().uuid().nullable().default(null),
  beneficiaryCitizenId: z.string(),
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
  /** Lúc luật sư xác nhận danh tính người nhận; null khi chưa. Backend cũ chưa gửi thì null. */
  identityConfirmedAt: timestamp.nullable().default(null),
  /** Lúc người nhận ký biên bản; null khi chưa ký. Backend cũ chưa gửi thì null. */
  recipientSignedAt: timestamp.nullable().default(null),
  /** Lúc lượt này được mở quyền tải (có chữ ký luật sư, Người thực thi và người nhận này); null khi chưa. Backend cũ chưa gửi thì null. */
  documentApprovedAt: timestamp.nullable().default(null),
  /** Lúc người nhận nhập đúng mã nhận; null khi chưa nhập hoặc kho không dùng mã. Backend cũ chưa gửi thì null. */
  keyVerifiedAt: timestamp.nullable().default(null),
  claimedAt: timestamp.nullable(),
  decisionDeadline: timestamp.nullable(),
  decidedAt: timestamp.nullable(),
  /** Người nhận đã bấm "Tôi đã nhận đủ" lúc này; Backend cũ chưa gửi thì null. */
  receivedAllAt: timestamp.nullable().default(null),
  /** Lúc Người thực thi ký phiếu giao nhận; null khi chưa. */
  receiptExecutorSignedAt: timestamp.nullable().default(null),
  /** Người nhận báo tài sản thiếu hoặc sai. */
  receiptIssueNote: z.string().nullable().default(null),
  receiptIssueAt: timestamp.nullable().default(null),
  grantStatus: handoverGrantStatusSchema.nullable(),
  grantExpiresAt: timestamp.nullable(),
  totalItems: z.number().int().nonnegative(),
  downloadedItems: z.number().int().nonnegative(),
  items: z.array(progressItemSchema),
});

/**
 * HandoverProgressResponse của GET /executor/handover-records/{recordId}/handover-progress.
 * Chỉ có tên/loại tài sản và số CCCD người nhận; không có nội dung tài sản.
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

/**
 * Executor gửi được mã nhận cho một người khi lượt của người đó đã được mở quyền tải (HANDOVER_COMMITTED: đủ chữ ký
 * luật sư, Người thực thi và chính người nhận) mà người nhận chưa nhập mã. Không chờ người nhận khác; trước đó chưa được
 * có mã; nhập mã rồi thì không cần gửi nữa.
 */
export function canMailHandoverKey(turn: HandoverProgressTurn): boolean {
  return turn.status === "HANDOVER_COMMITTED" && turn.keyVerifiedAt === null;
}

/** Người nhận đã ký phiếu giao nhận, tới lượt Người thực thi ký bên giao. */
export function canSignReceipt(turn: HandoverProgressTurn): boolean {
  return (
    turn.status === "HANDOVER_COMMITTED" &&
    turn.receivedAllAt !== null &&
    turn.receiptExecutorSignedAt === null
  );
}

/** SendHandoverKeyResponse của POST .../handover-turns/{turnId}/send-key. */
export const sendHandoverKeySchema = z.object({
  turnId: z.string().uuid(),
  sentAt: timestamp,
});
export type SendHandoverKeyResult = z.infer<typeof sendHandoverKeySchema>;
