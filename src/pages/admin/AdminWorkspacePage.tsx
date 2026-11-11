import { useLocation, useSearchParams } from "react-router-dom";
import {
  CreditCard,
  History,
  Home,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  TriangleAlert,
  Users,
  Wrench,
} from "lucide-react";
import {
  ADMIN_INCIDENTS_VISIBLE,
  AdminDevTools,
  AdminHolds,
  AdminIncidents,
  AdminOverview,
  AdminOverviewToolbar,
  AdminPayments,
  AdminSettings,
  AdminSystemConfig,
  AdminUsers,
  useAdminDashboard,
} from "@/features/admin";
import { DemoClockCard } from "@/features/dev-clock";
import { AdminAuditLogs } from "@/features/audit-logs/ui/AdminAuditLogs";
import { ACTION_LABELS } from "@/features/audit-logs/model/auditLogLabels";
import { AdminTwoFactorSettings } from "@/features/auth";
import { ROUTES } from "@/shared/config/routes.config";
import { ListSegmentTabs } from "@/shared/ui/listKit";
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

// Menu có các mục của prototype. Tạm giữ nằm trong chi tiết sự cố. Công cụ thử nghiệm (tua thời gian, tạm ngừng eKYC…)
// chỉ hiện ở menu khi bật DEV_TOOLS_ENABLED, cuối nhóm "Hệ thống".
const NAVIGATION_WITH_DEV_TOOLS: WorkspaceNavigationItem[] = DEV_TOOLS_ENABLED
  ? [
      ...NAVIGATION,
      {
        id: "dev-tools",
        label: "Công cụ thử nghiệm",
        icon: Wrench,
        to: `${ROUTES.ADMIN.ROOT}?view=dev-tools`,
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
    (view === "incidents" && ADMIN_INCIDENTS_VISIBLE) ||
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

const SETTINGS_TABS = [
  { value: "params", label: "Thông số hệ thống" },
  { value: "services", label: "Dịch vụ ngoài" },
] as const;

/**
 * Trang Cấu hình chia hai thẻ: thông số hệ thống và dịch vụ ngoài. Thẻ đang chọn nằm trên URL (`tab=services`),
 * đường dẫn cũ `view=system-config` mở thẳng thẻ dịch vụ ngoài. Cả hai thẻ luôn được dựng sẵn để bản nháp chưa lưu
 * của thông số không mất khi đổi thẻ; thẻ không chọn chỉ bị ẩn.
 */
function SettingsTabs() {
  const [params, setParams] = useSearchParams();
  const active =
    params.get("tab") === "services" || params.get("view") === "system-config"
      ? "services"
      : "params";
  const choose = (value: string) => {
    const next = new URLSearchParams(params);
    next.set("view", "settings");
    if (value === "services") next.set("tab", "services");
    else next.delete("tab");
    setParams(next, { replace: true });
  };
  return (
    <div className="space-y-6">
      <ListSegmentTabs
        label="Nhóm cấu hình"
        value={active}
        options={SETTINGS_TABS.map((tab) => ({ value: tab.value, label: tab.label }))}
        onChange={choose}
      />
      <div hidden={active !== "params"}>
        <AdminSettings section="params" />
      </div>
      <div hidden={active !== "services"}>
        <AdminSystemConfig />
      </div>
    </div>
  );
}

/** Khu vực Admin: dashboard, sự cố, tạm giữ và tài khoản; dữ liệu chỉ từ API quản trị thật. */
export function AdminWorkspacePage() {
  const location = useLocation();
  const view = viewFor(location.pathname, location.search);
  // Số sự cố đang mở hiện làm số đếm ở menu; dùng chung dữ liệu với trang Tổng quan nên không gọi thêm API.
  const dashboard = useAdminDashboard();
  // Sự cố đang ẩn (ADMIN_INCIDENTS_VISIBLE): bỏ mục khỏi menu, không cần số đếm.
  const navigation: WorkspaceNavigationItem[] = [];
  for (const item of NAVIGATION_WITH_DEV_TOOLS) {
    if (item.id === "incidents") {
      if (ADMIN_INCIDENTS_VISIBLE) {
        navigation.push({ ...item, badge: dashboard.data?.openIncidents ?? 0 });
      }
    } else {
      navigation.push(item);
    }
  }
  return (
    <WorkspaceFrame
      role="admin"
      active={view}
      navigation={navigation}
      title={VIEWS[view].title}
      description={VIEWS[view].description}
      actions={view === "overview" ? <AdminOverviewToolbar /> : undefined}
    >
      {view === "overview" && (
        <AdminOverview
          actionLabel={(action) => (ACTION_LABELS as Record<string, string>)[action] ?? action}
        />
      )}
      {view === "settings" && <SettingsTabs />}
      {view === "plans" && <AdminSettings section="plans" />}
      {view === "incidents" && ADMIN_INCIDENTS_VISIBLE && <AdminIncidents />}
      {view === "holds" && <AdminHolds />}
      {view === "payments" && <AdminPayments />}
      {view === "users" && (
        <AdminUsers
          actionLabel={(action) => (ACTION_LABELS as Record<string, string>)[action] ?? action}
        />
      )}
      {view === "security" && <AdminTwoFactorSettings />}
      {view === "dev-tools" && (
        <>
          <div className="mt-6">
            <DemoClockCard />
          </div>
          <AdminDevTools />
        </>
      )}
      {view === "audit" && <AdminAuditLogs />}
    </WorkspaceFrame>
  );
}
