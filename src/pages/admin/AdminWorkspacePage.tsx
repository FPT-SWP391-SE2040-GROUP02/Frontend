import { useLocation } from "react-router-dom";
import { AdminOverview, AdminUsers } from "@/features/admin";
import { ROUTES } from "@/shared/config/routes.config";
import {
  WorkspaceFrame,
  type WorkspaceNavigationItem,
} from "@/widgets/WorkspaceFrame/WorkspaceFrame";

const NAVIGATION: WorkspaceNavigationItem[] = [
  { id: "overview", label: "Tổng quan", to: ROUTES.ADMIN.ROOT },
  { id: "users", label: "Người dùng", to: ROUTES.DASHBOARD.USERS },
  { id: "audit", label: "Nhật ký kiểm toán", to: ROUTES.ADMIN.AUDIT_LOG },
];

const VIEWS = {
  overview: {
    title: "Tổng quan quản trị",
    description: "Số liệu vận hành hệ thống. Quản trị viên không đọc được nội dung kho.",
  },
  users: {
    title: "Người dùng",
    description: "Tìm và xem tài khoản theo vai trò, trạng thái.",
  },
  audit: {
    title: "Nhật ký kiểm toán",
    description: "Dấu vết thao tác quản trị.",
  },
} as const;

type AdminView = keyof typeof VIEWS;

function viewFor(pathname: string): AdminView {
  if (pathname === ROUTES.DASHBOARD.USERS) return "users";
  if (pathname === ROUTES.ADMIN.AUDIT_LOG) return "audit";
  return "overview";
}

/** Khu vực Admin chỉ đọc; view theo route đã có, dữ liệu chỉ từ API quản trị thật. */
export function AdminWorkspacePage() {
  const view = viewFor(useLocation().pathname);
  return (
    <WorkspaceFrame
      role="admin"
      active={view}
      navigation={NAVIGATION}
      title={VIEWS[view].title}
      description={VIEWS[view].description}
    >
      {view === "overview" && <AdminOverview />}
      {view === "users" && <AdminUsers />}
      {view === "audit" && (
        <section
          role="status"
          className="mt-6 rounded-xl border border-heritage-border p-6 text-sm text-heritage-muted"
        >
          Nhật ký kiểm toán quản trị chưa có API ở Backend, nên màn hình này chưa hiển thị dữ liệu.
        </section>
      )}
    </WorkspaceFrame>
  );
}
