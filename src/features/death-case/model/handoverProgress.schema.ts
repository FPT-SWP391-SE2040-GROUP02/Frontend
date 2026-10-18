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
