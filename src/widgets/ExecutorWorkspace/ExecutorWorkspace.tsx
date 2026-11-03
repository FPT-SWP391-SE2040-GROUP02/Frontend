import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeftRight,
  Home,
  ListChecks,
  Mail,
  Menu,
  Settings,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { UserAvatar } from "@/entities/user/ui/UserAvatar";
import { ROUTES } from "@/shared/config/routes.config";
import { cn } from "cn";
import { PageHeader } from "@/shared/ui/PageHeader";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { WorkspaceShell, WorkspaceTopbar, type BreadcrumbItem } from "@/shared/ui/WorkspaceShell";
import "@/widgets/OwnerWorkspace/owner-workspace.css";
import "./executor-workspace.css";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

/** Menu Người thực hiện theo bộ thiết kế: Tổng quan, Báo tin, Tiến trình, Quyền hạn, Cài đặt. */
const executorNavigation: NavItem[] = [
  { label: "Tổng quan", to: ROUTES.EXECUTOR.ROOT, icon: Home },
  { label: "Báo tin", to: ROUTES.EXECUTOR.REPORT, icon: ListChecks },
  { label: "Tiến trình", to: ROUTES.EXECUTOR.PROGRESS, icon: Mail },
  { label: "Quyền hạn", to: ROUTES.EXECUTOR.PERMISSIONS, icon: ShieldCheck },
  { label: "Cài đặt", to: ROUTES.EXECUTOR.SETTINGS, icon: Settings },
];

/**
 * Khung không gian Người thực hiện (Executor). Dữ liệu tài khoản lấy từ phiên đã xác thực;
 * quyền trên từng kho do Backend kiểm tra, khung này không cấp quyền.
 */
export function ExecutorWorkspace({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  /** Nhãn trạng thái đặt bên phải tiêu đề (ví dụ "Bản nháp"). */
  badge?: ReactNode;
  children: ReactNode;
}) {
  const location = useLocation();
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const path = location.pathname;
  const current = executorNavigation.find(({ to }) =>
    to === ROUTES.EXECUTOR.ROOT ? path === to : path === to || path.startsWith(`${to}/`),
  );
  const breadcrumb: BreadcrumbItem[] = [{ label: "Tổng quan", to: ROUTES.EXECUTOR.ROOT }];
  if (current && current.to !== ROUTES.EXECUTOR.ROOT) breadcrumb.push({ label: current.label });
  else if (!current) breadcrumb.push({ label: title });
  return (
    <WorkspaceShell
      className="owner-workspace"
      brand="LegacyVault"
      homeHref={ROUTES.EXECUTOR.ROOT}
      logoutHref={ROUTES.AUTH.LOGOUT}
      logoutLabel="Đăng xuất"
      navigation={
        <>
          <div className="owner-controls executor-controls">
            <p className="flex-1 self-center text-sm font-semibold">Không gian Người thực hiện</p>
            <button
              type="button"
              className="owner-menu-toggle"
              aria-label="Menu Người thực hiện"
              aria-expanded={navigationOpen}
              aria-controls="executor-navigation"
              onClick={() => setNavigationOpen(!navigationOpen)}
            >
              {navigationOpen ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
          <nav
            id="executor-navigation"
            aria-label="Điều hướng Người thực hiện"
            className="owner-navigation"
            data-open={navigationOpen}
          >
            {executorNavigation.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                aria-current={current?.to === to ? "page" : undefined}
                className="owner-nav-link"
                onClick={() => setNavigationOpen(false)}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        </>
      }
      topbar={
        <WorkspaceTopbar
          breadcrumb={breadcrumb}
          roleLabel="Người thực hiện"
          roleAction={
            <Link to={ROUTES.DASHBOARD.ROOT} className={cn(buttonStyles.outline, "px-4")}>
              <ArrowLeftRight className="size-4 shrink-0" aria-hidden="true" />
              Sang vai Chủ kho
            </Link>
          }
        />
      }
      footer={
        <>
          <div className="flex items-center gap-3">
            <UserAvatar
              user={user}
              fallbackLetter="N"
              className="size-10 bg-heritage-gold-soft text-heritage-on-gold"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.fullName ?? "Tài khoản"}</p>
              <p className="mt-0.5 text-xs text-heritage-gold-soft-hover">Người thực hiện</p>
            </div>
          </div>
        </>
      }
    >
      <PageHeader title={title} description={description} actions={badge} />
      {children}
      <footer className="pt-2 text-xs leading-5 text-heritage-muted">
        LegacyVault hỗ trợ lưu giữ và bàn giao dữ liệu số. Không thay thế di chúc hoặc thủ tục thừa
        kế.
      </footer>
    </WorkspaceShell>
  );
}
