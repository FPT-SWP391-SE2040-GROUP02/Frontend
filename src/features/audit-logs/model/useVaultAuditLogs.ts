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

/**
 * @description Admin đọc nhật ký toàn hệ thống. 404 là quyết định quyền nên không retry; `staleTime: 0` để
 * mở lại màn luôn thấy dòng mới (ví dụ hồ sơ vừa bị từ chối).
 */
export function useAdminAuditLogs(query: AuditLogQuery, enabled: boolean) {
  return useQuery({
    queryKey: auditLogKeys.adminList(query),
    queryFn: ({ signal }) => auditLogService.listAll(query, signal),
    enabled,
    retry: false,
    staleTime: 0,
  });
}
