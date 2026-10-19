import { z } from "zod";
const timestamp = z.string().datetime({ offset: true });
export const invitationSchema = z.object({ valid: z.boolean(), responseExpired: z.boolean() });
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
