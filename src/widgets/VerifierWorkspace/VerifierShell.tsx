import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
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
import "@/widgets/ExecutorWorkspace/executor-workspace.css";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

/** Menu Người xét duyệt theo bộ thiết kế: Tổng quan, Hàng chờ, Tiêu chí, Lịch sử, Cài đặt. */
const verifierNavigation: NavItem[] = [
  { label: "Tổng quan", to: ROUTES.NOTARY.WORKSPACE, icon: Home },
  { label: "Hàng chờ", to: ROUTES.NOTARY.QUEUE, icon: ListChecks },
  { label: "Tiêu chí", to: ROUTES.NOTARY.CRITERIA, icon: ShieldCheck },
  { label: "Lịch sử", to: ROUTES.NOTARY.HISTORY, icon: Mail },
  { label: "Cài đặt", to: ROUTES.NOTARY.SETTINGS, icon: Settings },
];

/**
 * Khung không gian Người xét duyệt (Verifier). Vai trò do Backend xác minh từ DB (ROLE-04);
 * khung này chỉ trình bày, không cấp quyền.
 */
export function VerifierShell({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  /** Nhãn trạng thái đặt bên phải tiêu đề. */
  badge?: ReactNode;
  children: ReactNode;
}) {
  const location = useLocation();
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const path = location.pathname;
  const current = verifierNavigation.find(({ to }) =>
    to === ROUTES.NOTARY.WORKSPACE ? path === to : path === to || path.startsWith(`${to}/`),
  );
  return (
    <WorkspaceShell
      className="owner-workspace"
      brand="LegacyVault"
      homeHref={ROUTES.NOTARY.WORKSPACE}
      logoutHref={ROUTES.AUTH.LOGOUT}
      logoutLabel="Đăng xuất"
      navigation={
        <>
          <div className="owner-controls executor-controls">
            <p className="flex-1 self-center text-sm font-semibold">Không gian Người xét duyệt</p>
            <button
              type="button"
              className="owner-menu-toggle"
              aria-label="Menu Người xét duyệt"
              aria-expanded={navigationOpen}
              aria-controls="verifier-navigation"
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
            id="verifier-navigation"
            aria-label="Điều hướng Người xét duyệt"
            className="owner-navigation"
            data-open={navigationOpen}
          >
            {verifierNavigation.map(({ to, label, icon: Icon }) => (
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
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E0C486] font-semibold text-[#0A281E]"
            aria-hidden="true"
          >
            {user?.fullName?.trim().charAt(0).toLocaleUpperCase("vi-VN") || "N"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.fullName ?? "Tài khoản"}</p>
            <p className="mt-0.5 text-xs text-[#E6C98B]">Người xét duyệt</p>
          </div>
        </div>
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
    </WorkspaceShell>
  );
}
