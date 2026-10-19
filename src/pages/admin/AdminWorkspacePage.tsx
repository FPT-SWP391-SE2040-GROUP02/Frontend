import { useLocation } from "react-router-dom";
import { AdminHolds, AdminIncidents, AdminOverview, AdminUsers } from "@/features/admin";
import { ROUTES } from "@/shared/config/routes.config";
import {
  WorkspaceFrame,
  type WorkspaceNavigationItem,
} from "@/widgets/WorkspaceFrame/WorkspaceFrame";

const NAVIGATION: WorkspaceNavigationItem[] = [
  { id: "overview", label: "Tổng quan", to: ROUTES.ADMIN.ROOT },
  { id: "incidents", label: "Sự cố", to: `${ROUTES.ADMIN.ROOT}?view=incidents` },
  { id: "holds", label: "Tạm giữ", to: `${ROUTES.ADMIN.ROOT}?view=holds` },
  { id: "users", label: "Người dùng", to: ROUTES.DASHBOARD.USERS },
  { id: "audit", label: "Nhật ký kiểm toán", to: ROUTES.ADMIN.AUDIT_LOG },
];

const VIEWS = {
  overview: {
    title: "Tổng quan quản trị",
    description: "Số liệu vận hành hệ thống. Quản trị viên không đọc được nội dung kho.",
  },
  incidents: {
    title: "Sự cố vận hành",
    description: "Theo dõi, giao người phụ trách và đóng các sự cố của hệ thống.",
  },
  holds: {
    title: "Tạm giữ",
    description: "Xem, đặt, rà soát và gỡ tạm giữ trên kho hoặc gói.",
  },
  users: {
    title: "Người dùng",
    description: "Tìm tài khoản, đổi vai trò hoặc khóa tài khoản kèm lý do.",
  },
  audit: {
    title: "Nhật ký kiểm toán",
    description: "Dấu vết thao tác quản trị.",
  },
} as const;

type AdminView = keyof typeof VIEWS;

/** Sự cố và tạm giữ dùng `?view=` trên route gốc để không cần thêm route mới. */
function viewFor(pathname: string, search: string): AdminView {
  if (pathname === ROUTES.DASHBOARD.USERS) return "users";
  if (pathname === ROUTES.ADMIN.AUDIT_LOG) return "audit";
  const view = new URLSearchParams(search).get("view");
  if (view === "incidents" || view === "holds") return view;
  return "overview";
}

/** Khu vực Admin: dashboard, sự cố, tạm giữ và tài khoản; dữ liệu chỉ từ API quản trị thật. */
export function AdminWorkspacePage() {
  const location = useLocation();
  const view = viewFor(location.pathname, location.search);
  return (
    <WorkspaceFrame
      role="admin"
      active={view}
      navigation={NAVIGATION}
      title={VIEWS[view].title}
      description={VIEWS[view].description}
    >
      {view === "overview" && <AdminOverview />}
      {view === "incidents" && <AdminIncidents />}
      {view === "holds" && <AdminHolds />}
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
