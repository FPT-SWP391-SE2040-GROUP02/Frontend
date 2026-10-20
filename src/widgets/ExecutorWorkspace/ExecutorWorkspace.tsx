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
import { ROUTES } from "@/shared/config/routes.config";
import { WorkspaceShell } from "@/shared/ui/WorkspaceShell";
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
      footer={
        <>
          <Link
            to={ROUTES.DASHBOARD.ROOT}
            className="mb-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#E0C486] px-4 text-sm font-semibold text-[#0A281E] hover:bg-[#E8CF9B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
          >
            <ArrowLeftRight className="size-4" aria-hidden="true" />
            Sang vai Chủ kho
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E0C486] font-semibold text-[#0A281E]"
              aria-hidden="true"
            >
              {user?.fullName?.trim().charAt(0).toLocaleUpperCase("vi-VN") || "N"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.fullName ?? "Tài khoản"}</p>
              <p className="mt-0.5 text-xs text-[#E6C98B]">Người thực hiện</p>
            </div>
          </div>
        </>
      }
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold text-heritage-primary">{title}</h1>
          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-heritage-muted">{description}</p>
          )}
        </div>
        {badge}
      </header>
      {children}
      <footer className="pt-2 text-xs leading-5 text-heritage-muted">
        LegacyVault hỗ trợ lưu giữ và bàn giao dữ liệu số. Không thay thế di chúc hoặc thủ tục thừa
        kế.
      </footer>
    </WorkspaceShell>
  );
}
