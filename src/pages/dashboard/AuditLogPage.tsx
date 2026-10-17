import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerAuditLog } from "@/widgets/OwnerWorkspace/OwnerAuditLog";

/**
 * @description Màn Owner xem nhật ký hoạt động của kho (SRS SEC-13 / SEC-07).
 * Endpoint chỉ đọc; cache phân vùng theo vault + filter; auth transitions clear cache.
 */
export function AuditLogPage() {
  return (
    <OwnerWorkspace
      title="Nhật ký hoạt động"
      description="Lịch sử thao tác đã lưu thành công trên kho của bạn. Nhật ký chỉ đọc; không thể sửa hoặc xóa."
    >
      <OwnerAuditLog />
    </OwnerWorkspace>
  );
}
