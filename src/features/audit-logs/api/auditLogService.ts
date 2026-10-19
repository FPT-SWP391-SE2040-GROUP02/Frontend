import { z } from "zod";
import { apiClient } from "@/shared/api";
import { auditLogPageSchema, auditLogQuerySchema } from "../model/auditLog.schema";
import type { AuditLogQuery } from "../model/auditLog.schema";

const id = z.string().uuid();
const path = (vaultId: string) => `/vaults/${id.parse(vaultId)}/audit-logs`;

/**
 * @description Transport raw cho nhật ký hoạt động của kho.
 * Endpoint GET /vaults/{vaultId}/audit-logs trả raw `PaginatedList<AuditLogResponse>`
 * (không envelope). `searchTerm` không dùng; `action` chỉ nhận UPPER_SNAKE_CASE;
 * khoảng thời gian `[from, to)` đúng offset ISO 8601.
 *
 * Service unwrap envelope đúng một lần (ở đây không có), nên gọi schema parse thẳng.
 */
export const auditLogService = {
  async list(vaultId: string, query: AuditLogQuery, signal?: AbortSignal) {
    const params = auditLogQuerySchema.parse(query);
    return auditLogPageSchema.parse(
      await apiClient.get<unknown, unknown>(path(vaultId), { params, signal }),
    );
  },
};
