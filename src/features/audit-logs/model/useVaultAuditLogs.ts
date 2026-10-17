import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "../api/auditLogService";
import { auditLogKeys } from "./auditLogKeys";
import type { AuditLogQuery } from "./auditLog.schema";

/**
 * @description Đọc nhật ký hoạt động của kho.
 * Caller truyền `enabled` để chặn request khi chưa biết vaultId hoặc phiên chưa sẵn sàng.
 * `staleTime: 0` đảm bảo remount (ví dụ chuyển trang rồi quay lại) luôn lấy dữ liệu mới,
 * kể cả sau khi một mutation Owner đã sinh dòng nhật ký mới.
 */
export function useVaultAuditLogs(vaultId: string, query: AuditLogQuery, enabled: boolean) {
  return useQuery({
    queryKey: auditLogKeys.list(vaultId, query),
    queryFn: ({ signal }) => auditLogService.list(vaultId, query, signal),
    enabled: enabled && Boolean(vaultId),
    retry: false,
    staleTime: 0,
  });
}
