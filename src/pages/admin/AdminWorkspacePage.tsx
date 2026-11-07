import { useLocation } from "react-router-dom";
import {
  CreditCard,
  History,
  Home,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  TriangleAlert,
  Users,
  Wrench,
} from "lucide-react";
import {
  AdminDevTools,
  AdminHolds,
  AdminIncidents,
  AdminOverview,
  AdminPayments,
  AdminSettings,
  AdminSystemConfig,
  AdminUsers,
  useAdminDashboard,
} from "@/features/admin";
import { AdminAuditLogs } from "@/features/audit-logs/ui/AdminAuditLogs";
import { ACTION_LABELS } from "@/features/audit-logs/model/auditLogLabels";
import { AdminTwoFactorSettings } from "@/features/auth";
import { ROUTES } from "@/shared/config/routes.config";
import { ENV } from "@/shared/config/env";
import {
  WorkspaceFrame,
  type WorkspaceNavigationItem,
} from "@/widgets/WorkspaceFrame/WorkspaceFrame";

/** Thứ tự và nhóm menu theo prototype: bốn trang chính, rồi nhóm "Hệ thống". */
const NAVIGATION: WorkspaceNavigationItem[] = [
  { id: "overview", label: "Tổng quan", icon: Home, to: ROUTES.ADMIN.ROOT },
  {
    id: "incidents",
    label: "Sự cố",
    icon: TriangleAlert,
    to: `${ROUTES.ADMIN.ROOT}?view=incidents`,
  },
  {
    id: "payments",
    label: "Giao dịch",
    icon: CreditCard,
    to: `${ROUTES.ADMIN.ROOT}?view=payments`,
  },
  { id: "users", label: "Người dùng", icon: Users, to: ROUTES.DASHBOARD.USERS },
  {
    id: "plans",
    label: "Gói dịch vụ",
    icon: Tag,
    to: `${ROUTES.ADMIN.ROOT}?view=plans`,
    group: "Hệ thống",
  },
  {
    id: "settings",
    label: "Cấu hình",
    icon: SlidersHorizontal,
    to: `${ROUTES.ADMIN.ROOT}?view=settings`,
    group: "Hệ thống",
  },
  {
    id: "holds",
    label: "Tạm giữ",
    icon: Lock,
    to: `${ROUTES.ADMIN.ROOT}?view=holds`,
    group: "Hệ thống",
  },
  {
    id: "audit",
    label: "Nhật ký hoạt động",
    icon: History,
    to: ROUTES.ADMIN.AUDIT_LOG,
    group: "Hệ thống",
  },
  {
    id: "security",
    label: "Bảo mật tài khoản",
    icon: ShieldCheck,
    to: `${ROUTES.ADMIN.ROOT}?view=security`,
    group: "Hệ thống",
  },
];

/**
 * Công cụ thử nghiệm bật khi chạy `npm run dev` HOẶC bản build/preview có VITE_ENABLE_DEVTOOLS=true
 * (Backend DevToolsController cũng mở ở Development hoặc Staging).
 */
const DEV_TOOLS_ENABLED = import.meta.env.DEV || ENV.ENABLE_DEVTOOLS;

const NAVIGATION_WITH_DEV_TOOLS: WorkspaceNavigationItem[] = DEV_TOOLS_ENABLED
  ? [
      ...NAVIGATION,
      {
        id: "dev-tools",
        label: "Công cụ thử nghiệm",
        to: `${ROUTES.ADMIN.ROOT}?view=dev-tools`,
        icon: Wrench,
        group: "Hệ thống",
      },
    ]
  : NAVIGATION;

const VIEWS = {
  overview: {
    title: "Tổng quan",
    description: "",
  },
  plans: {
    title: "Gói dịch vụ",
    description: "",
  },
  settings: {
    title: "Cấu hình",
    description: "",
  },
  incidents: {
    title: "Sự cố",
    description: "",
  },
  holds: {
    title: "Tạm giữ",
    description: "",
  },
  payments: {
    title: "Giao dịch",
    description: "",
  },
  users: {
    title: "Người dùng",
    description: "",
  },
  audit: {
    title: "Nhật ký hoạt động",
    description: "",
  },
  security: {
    title: "Bảo mật tài khoản",
    description: "",
  },
  "dev-tools": {
    title: "Công cụ thử nghiệm",
    description: "",
  },
} as const;

type AdminView = keyof typeof VIEWS;

/** Sự cố, tạm giữ, cấu hình và giao dịch dùng `?view=` trên route gốc để không cần thêm route mới. */
function viewFor(pathname: string, search: string): AdminView {
  if (pathname === ROUTES.DASHBOARD.USERS) return "users";
  if (pathname === ROUTES.ADMIN.AUDIT_LOG) return "audit";
  const view = new URLSearchParams(search).get("view");
  if (
    view === "settings" ||
    view === "plans" ||
    view === "incidents" ||
    view === "holds" ||
    view === "payments" ||
    view === "security"
  )
    return view;
  // Đường dẫn cũ của trang Cấu hình dịch vụ nay nằm trong trang Cấu hình.
  if (view === "system-config") return "settings";
  if (view === "dev-tools" && DEV_TOOLS_ENABLED) return view;
  return "overview";
}

/** Khu vực Admin: dashboard, sự cố, tạm giữ và tài khoản; dữ liệu chỉ từ API quản trị thật. */
export function AdminWorkspacePage() {
  const location = useLocation();
  const view = viewFor(location.pathname, location.search);
  // Số sự cố đang mở hiện làm số đếm ở menu; dùng chung dữ liệu với trang Tổng quan nên không gọi thêm API.
  const dashboard = useAdminDashboard();
  const navigation = NAVIGATION_WITH_DEV_TOOLS.map((item) =>
    item.id === "incidents" ? { ...item, badge: dashboard.data?.openIncidents ?? 0 } : item,
  );
  return (
    <WorkspaceFrame
      role="admin"
      active={view}
      navigation={navigation}
      title={VIEWS[view].title}
      description={VIEWS[view].description}
    >
      {view === "overview" && (
        <AdminOverview
          actionLabel={(action) => (ACTION_LABELS as Record<string, string>)[action] ?? action}
        />
      )}
      {view === "settings" && (
        <>
          <AdminSettings section="params" />
          <h2 className="mt-10 text-xl font-semibold">Dịch vụ ngoài</h2>
          <AdminSystemConfig />
        </>
      )}
      {view === "plans" && <AdminSettings section="plans" />}
      {view === "incidents" && <AdminIncidents />}
      {view === "holds" && <AdminHolds />}
      {view === "payments" && <AdminPayments />}
      {view === "users" && (
        <AdminUsers
          actionLabel={(action) => (ACTION_LABELS as Record<string, string>)[action] ?? action}
        />
      )}
      {view === "security" && <AdminTwoFactorSettings />}
      {view === "dev-tools" && <AdminDevTools />}
      {view === "audit" && <AdminAuditLogs />}
    </WorkspaceFrame>
  );
}
