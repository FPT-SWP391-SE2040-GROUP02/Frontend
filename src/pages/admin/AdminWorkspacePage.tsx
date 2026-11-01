import { useLocation } from "react-router-dom";
import {
  AdminDevTools,
  AdminHolds,
  AdminIncidents,
  AdminOverview,
  AdminPayments,
  AdminUsers,
} from "@/features/admin";
import { AdminAuditLogs } from "@/features/audit-logs/ui/AdminAuditLogs";
import { AdminTwoFactorSettings } from "@/features/auth";
import { ROUTES } from "@/shared/config/routes.config";
import { ENV } from "@/shared/config/env";
import {
  WorkspaceFrame,
  type WorkspaceNavigationItem,
} from "@/widgets/WorkspaceFrame/WorkspaceFrame";

const NAVIGATION: WorkspaceNavigationItem[] = [
  { id: "overview", label: "Tổng quan", to: ROUTES.ADMIN.ROOT },
  { id: "incidents", label: "Sự cố", to: `${ROUTES.ADMIN.ROOT}?view=incidents` },
  { id: "holds", label: "Tạm giữ", to: `${ROUTES.ADMIN.ROOT}?view=holds` },
  { id: "payments", label: "Giao dịch thanh toán", to: `${ROUTES.ADMIN.ROOT}?view=payments` },
  { id: "users", label: "Người dùng", to: ROUTES.DASHBOARD.USERS },
  { id: "audit", label: "Nhật ký hoạt động", to: ROUTES.ADMIN.AUDIT_LOG },
  { id: "security", label: "Bảo mật tài khoản", to: `${ROUTES.ADMIN.ROOT}?view=security` },
];

/**
 * Công cụ thử nghiệm bật khi chạy `npm run dev` HOẶC bản build/preview có VITE_ENABLE_DEVTOOLS=true
 * (Backend DevToolsController cũng mở ở Development hoặc Staging).
 */
const DEV_TOOLS_ENABLED = import.meta.env.DEV || ENV.ENABLE_DEVTOOLS;

const NAVIGATION_WITH_DEV_TOOLS: WorkspaceNavigationItem[] = DEV_TOOLS_ENABLED
  ? [
      ...NAVIGATION,
      { id: "dev-tools", label: "Công cụ thử nghiệm", to: `${ROUTES.ADMIN.ROOT}?view=dev-tools` },
    ]
  : NAVIGATION;

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
  payments: {
    title: "Giao dịch thanh toán",
    description: "Tiền vào qua SePay và kết quả đối chiếu với đơn. Chỉ xem, không sửa giao dịch.",
  },
  users: {
    title: "Người dùng",
    description: "Tìm tài khoản, đổi vai trò hoặc khóa tài khoản kèm lý do.",
  },
  audit: {
    title: "Nhật ký hoạt động",
    description:
      "Ai đã làm gì và lúc nào trên toàn hệ thống, mới nhất trước, kể cả các hồ sơ bị từ chối.",
  },
  security: {
    title: "Bảo mật tài khoản",
    description: "Bật hoặc tắt xác thực hai bước cho tài khoản quản trị của bạn.",
  },
  "dev-tools": {
    title: "Công cụ thử nghiệm",
    description: "Tua thời gian của một hồ sơ để thử luồng bàn giao mà không phải chờ.",
  },
} as const;

type AdminView = keyof typeof VIEWS;

/** Sự cố, tạm giữ và giao dịch dùng `?view=` trên route gốc để không cần thêm route mới. */
function viewFor(pathname: string, search: string): AdminView {
  if (pathname === ROUTES.DASHBOARD.USERS) return "users";
  if (pathname === ROUTES.ADMIN.AUDIT_LOG) return "audit";
  const view = new URLSearchParams(search).get("view");
  if (view === "incidents" || view === "holds" || view === "payments" || view === "security")
    return view;
  if (view === "dev-tools" && DEV_TOOLS_ENABLED) return view;
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
      navigation={NAVIGATION_WITH_DEV_TOOLS}
      title={VIEWS[view].title}
      description={VIEWS[view].description}
    >
      {view === "overview" && <AdminOverview />}
      {view === "incidents" && <AdminIncidents />}
      {view === "holds" && <AdminHolds />}
      {view === "payments" && <AdminPayments />}
      {view === "users" && <AdminUsers />}
      {view === "security" && <AdminTwoFactorSettings />}
      {view === "dev-tools" && <AdminDevTools />}
      {view === "audit" && <AdminAuditLogs />}
    </WorkspaceFrame>
  );
}
