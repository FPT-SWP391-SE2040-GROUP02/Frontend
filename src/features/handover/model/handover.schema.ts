import { z } from "zod";
const timestamp = z.string().datetime({ offset: true });
export const invitationSchema = z.object({ valid: z.boolean(), responseExpired: z.boolean() });
/** Kết quả kiểm thư mời bằng mã hồ sơ và 4 số cuối căn cước (POST /handover/invitations/{token}/check-mail). */
export const mailCheckSchema = z.object({
  verified: z.boolean(),
  attemptsLeft: z.number().int().min(0),
  containerName: z.string().nullish(),
  ownerFullName: z.string().nullish(),
});
export type MailCheck = z.infer<typeof mailCheckSchema>;
/** Hồ sơ người nhận (GET/POST /handover/turns/{id}/submission): trạng thái và lý do cần bổ sung. */
export const submissionSchema = z.object({
  id: z.string().uuid(),
  turnId: z.string().uuid(),
  kind: z.enum(["ACCEPT", "DECLINE"]),
  status: z.enum(["SUBMITTED", "SUPPLEMENT_REQUESTED", "APPROVED", "SUPERSEDED"]),
  supplementReason: z.string().nullish(),
  createdAt: z.string(),
});
export type Submission = z.infer<typeof submissionSchema>;
export const handoverItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: z.enum(["FILE", "TEXT"]),
  fileName: z.string().nullable(),
  contentType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
});
/** Snapshot và quyền từ BE, không suy ra eligibility bằng đồng hồ/role FE. */
export const handoverTurnSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "INVITED",
    "INITIAL_RESPONSE_EXPIRED",
    "IDENTITY_IN_PROGRESS",
    "READY_TO_ACCEPT",
    "HANDOVER_COMMITTED",
    "DECLINED",
    "DECISION_EXPIRED",
    "CANCELLED",
    "LAPSED",
  ]),
  serverTime: timestamp,
  invitedAt: timestamp,
  responseDeadline: timestamp,
  decisionDeadline: timestamp.nullable(),
  identityBypassed: z.boolean(),
  identityConfirmedByExecutor: z.boolean(),
  /** Kho đã cấp khóa mở gói: người nhận phải nhập khóa do Người thực hiện đưa trước khi đồng ý. */
  keyRequired: z.boolean().default(false),
  /** Đã nhập đúng khóa (hoặc không cần khóa). */
  keyVerified: z.boolean().default(true),
  container: z.object({ name: z.string() }).nullable(),
  items: z.array(handoverItemSchema),
  grant: z
    .object({
      id: z.string().uuid(),
      status: z.enum(["ACTIVE", "BLOCKED", "EXPIRED", "REVOKED"]),
      expiresAt: timestamp,
    })
    .nullable(),
});
