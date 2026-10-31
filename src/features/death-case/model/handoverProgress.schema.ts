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
  beneficiaryCitizenIdLast4: z.string(),
  status: handoverTurnStatusSchema,
  /** true: lượt do chính tài khoản đang xem nhận; Executor không tự xác nhận được lượt này (BR-122). */
  claimedByYou: z.boolean(),
  /** true: một Executor đã xác nhận đúng người bằng tay thay cho eKYC (BR-122). */
  identityConfirmedByExecutor: z.boolean(),
  invitedAt: timestamp,
  responseDeadline: timestamp,
  claimedAt: timestamp.nullable(),
  decisionDeadline: timestamp.nullable(),
  decidedAt: timestamp.nullable(),
  grantStatus: handoverGrantStatusSchema.nullable(),
  grantExpiresAt: timestamp.nullable(),
  totalItems: z.number().int().nonnegative(),
  downloadedItems: z.number().int().nonnegative(),
  items: z.array(progressItemSchema),
});

/**
 * HandoverProgressResponse của GET /executor/death-cases/{caseId}/handover-progress.
 * Chỉ có tên/loại tài sản và 4 số cuối CCCD người nhận; không có nội dung tài sản hay liên hệ.
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
export const RESENDABLE_TURN_STATUSES: ReadonlyArray<HandoverProgressTurn["status"]> = [
  "INVITED",
  "INITIAL_RESPONSE_EXPIRED",
];

/** Lượt đã có người nhận và đang chờ xác minh danh tính: Executor được xác nhận đúng người bằng tay (BR-122). */
export function canConfirmIdentity(turn: HandoverProgressTurn): boolean {
  return turn.status === "IDENTITY_IN_PROGRESS" && !turn.claimedByYou;
}

/** ConfirmHandoverIdentityResponse của POST .../handover-turns/{turnId}/confirm-identity. */
export const confirmIdentitySchema = z.object({
  turnId: z.string().uuid(),
  status: handoverTurnStatusSchema,
  identityConfirmedAt: timestamp,
  decisionDeadline: timestamp,
});
export type ConfirmIdentityResult = z.infer<typeof confirmIdentitySchema>;

/** ResendHandoverInvitationResponse của POST .../handover-turns/{turnId}/resend-invitation. */
export const resendInvitationSchema = z.object({
  turnId: z.string().uuid(),
  invitationSentAt: timestamp,
  responseDeadline: timestamp,
});
export type ResendInvitationResult = z.infer<typeof resendInvitationSchema>;
