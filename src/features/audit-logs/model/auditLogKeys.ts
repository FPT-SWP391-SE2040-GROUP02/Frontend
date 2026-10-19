import type { AuditLogQuery } from "./auditLog.schema";

/**
 * @description Cache key tách theo vault + filters + pagination.
 * AuthBootstrap xóa toàn bộ cache khi đổi identity; đổi account không publish data cũ.
 */
export const auditLogKeys = {
  all: ["audit-logs"] as const,
  list: (vaultId: string, query?: AuditLogQuery) => ["audit-logs", vaultId, query ?? {}] as const,
};
