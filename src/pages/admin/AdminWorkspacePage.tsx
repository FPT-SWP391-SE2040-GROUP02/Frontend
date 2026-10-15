import { WorkspaceFrame } from "@/widgets/WorkspaceFrame/WorkspaceFrame";
/** Không dựng số liệu, audit hoặc danh sách tài khoản từ fixture. */
export function AdminWorkspacePage() {
  return (
    <WorkspaceFrame
      role="admin"
      title="Quản trị hệ thống"
      description="Công cụ quản lý và kiểm tra hoạt động của hệ thống."
    >
      <section
        role="status"
        className="rounded-xl border border-heritage-border p-6 text-sm text-heritage-muted"
      >
        Dữ liệu quản trị chưa được kết nối trên màn hình này.
      </section>
    </WorkspaceFrame>
  );
}
