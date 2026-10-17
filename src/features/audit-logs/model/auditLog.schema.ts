import { z } from "zod";
import { paginatedListSchema, paginationRequestSchema } from "@/shared/api/pagination.schema";

/**
 * @description Wire enums cho nhật ký hoạt động của kho (Backend AuditAction).
 * Giá trị đúng UPPER_SNAKE_CASE từ `Backend/src/LegacyVault.Application/Mappings/EnumText.ToUpperSnake`.
 * Không dùng tên C# (PascalCase) làm wire value.
 */
export const auditActionValues = [
  "VAULT_CREATED",
  "VAULT_UPDATED",
  "ASSET_CREATED",
  "CONTAINER_CREATED",
  "CONTAINER_UPDATED",
  "CONTAINER_ARCHIVED",
  "CONTAINER_ASSET_ADDED",
  "CONTAINER_ASSET_REMOVED",
  "CONTAINER_BENEFICIARY_ADDED",
  "CONTAINER_BENEFICIARY_REMOVED",
  "PLAN_DEACTIVATED",
  "BENEFICIARY_CREATED",
  "BENEFICIARY_UPDATED",
  "BENEFICIARY_DELETED",
  "CHECKED_IN",
  "CHECK_IN_SETTINGS_UPDATED",
  "HOLD_PLACED",
  "HOLD_RELEASED",
  "INCIDENT_ASSIGNED",
  "INCIDENT_RESOLVED",
  "USER_ROLE_CHANGED",
  "USER_STATUS_CHANGED",
  "VERIFIER_REASSIGNED",
  "OBJECTION_REPORTED",
  "OBJECTION_CONCLUDED",
] as const;

/** Wire role người thực hiện; SYSTEM dùng khi job nền. */
export const auditActorRoleValues = [
  "OWNER",
  "EXECUTOR",
  "BENEFICIARY",
  "VERIFIER",
  "ADMIN",
  "SYSTEM",
] as const;

/** Loại đối tượng bị tác động; khớp AuditTargetType. */
export const auditTargetTypeValues = [
  "VAULT",
  "PLAN",
  "ASSET",
  "CONTAINER",
  "BENEFICIARY",
  "CHECK_IN",
  "DEATH_CASE",
  "HOLD",
  "INCIDENT",
  "USER",
] as const;

/** Kết quả; hiện tại Backend chỉ ghi SUCCEEDED. */
export const auditOutcomeValues = ["SUCCEEDED", "DENIED", "FAILED"] as const;

const isoDateTimeOffset = z.string().datetime({ offset: true });
const uuid = z.string().uuid();

/**
 * @description Raw DTO `AuditLogResponse`; nullable giữ nguyên contract.
 * Id là Guid non-null theo Backend `AuditLogResponse.Id`; UI fallback hiển thị chuỗi.
 */
export const auditLogResponseSchema = z.object({
  id: uuid,
  at: isoDateTimeOffset,
  actorRole: z.enum(auditActorRoleValues),
  actorUserId: uuid.nullable(),
  action: z.enum(auditActionValues),
  targetType: z.enum(auditTargetTypeValues),
  targetId: uuid.nullable(),
  targetVersion: z.number().int().nullable(),
  outcome: z.enum(auditOutcomeValues),
  reason: z.string().nullable(),
});

/** Raw `PaginatedList<AuditLogResponse>`; service parse đúng một lần. */
export const auditLogPageSchema = paginatedListSchema(auditLogResponseSchema);

/**
 * @description Query gửi tới Backend (mapped từ URL filters).
 * `searchTerm` bị loại bỏ vì AuditLogsController không dùng; schema strict để FE
 * không forward thuộc tính thừa sang Backend.
 * `sortBy` chỉ nhận `at` (mọi giá trị khác bị Backend từ chối 400).
 */
export const auditLogQuerySchema = paginationRequestSchema
  .omit({ searchTerm: true })
  .extend({
    sortBy: z.literal("at").optional(),
    action: z.enum(auditActionValues).optional(),
    from: isoDateTimeOffset.optional(),
    to: isoDateTimeOffset.optional(),
  })
  .strict();

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
export type AuditLogEntry = z.infer<typeof auditLogResponseSchema>;
export type AuditAction = (typeof auditActionValues)[number];
