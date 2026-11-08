import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeftRight, Home, ListChecks, Menu, Send, X, type LucideIcon } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { UserAvatar } from "@/entities/user/ui/UserAvatar";
import { ROUTES } from "@/shared/config/routes.config";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { useMyInvitations } from "@/features/plan-setup/model/useMyInvitations";
import { InvitationCountBadge } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { WorkspaceShell } from "@/shared/ui/WorkspaceShell";
import "@/widgets/OwnerWorkspace/owner-workspace.css";
import "./executor-workspace.css";
import { NotificationBell } from "@/features/death-case/ui/NotificationBell";
import { ExecutorOwnerSwitcher } from "./ExecutorOwnerSwitcher";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

/**
 * Menu chính của Người thực thi: Tổng quan, Báo tin, Bàn giao.
 * Lời mời, Quyền hạn, Cài đặt ít dùng nên nằm ở chân thanh bên, dưới nút đổi vai.
 */
const executorNavigation: NavItem[] = [
  { label: "Tổng quan", to: ROUTES.EXECUTOR.ROOT, icon: Home },
  { label: "Báo tin", to: ROUTES.EXECUTOR.REPORT, icon: ListChecks },
  { label: "Bàn giao", to: ROUTES.EXECUTOR.PROGRESS, icon: Send },
];

const accountNavigation: Array<{ label: string; to: string }> = [
  { label: "Lời mời", to: ROUTES.EXECUTOR.INVITATIONS },
  { label: "Quyền hạn", to: ROUTES.EXECUTOR.PERMISSIONS },
  { label: "Cài đặt", to: ROUTES.EXECUTOR.SETTINGS },
];

/**
 * Khung không gian Người thực thi (Executor). Dữ liệu tài khoản lấy từ phiên đã xác thực;
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
  const isAuthenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const invitations = useMyInvitations(isAuthenticated && Boolean(accessTokenMemory.get()));
  let pendingInvitations = 0;
  if (invitations.isSuccess) pendingInvitations = invitations.data.pending.length;
  const path = location.pathname;
  const isCurrent = (to: string): boolean => {
    if (to === ROUTES.EXECUTOR.ROOT) return path === to;
    return path === to || path.startsWith(`${to}/`);
  };
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
            <p className="flex-1 self-center text-sm font-semibold">Không gian Người thực thi</p>
            <button
              type="button"
              className="owner-menu-toggle"
              aria-label="Menu Người thực thi"
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
            aria-label="Điều hướng Người thực thi"
            className="owner-navigation"
            data-open={navigationOpen}
          >
            <div className="px-2 pt-2">
              <ExecutorOwnerSwitcher />
            </div>
            {executorNavigation.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                aria-current={isCurrent(to) ? "page" : undefined}
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
          <nav aria-label="Tài khoản" className="mb-3 flex flex-wrap gap-1">
            {accountNavigation.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                aria-current={isCurrent(to) ? "page" : undefined}
                className="flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm text-[#E9EFE9] hover:bg-white/10 aria-[current=page]:bg-white/15 aria-[current=page]:font-semibold"
                onClick={() => setNavigationOpen(false)}
              >
                {label}
                {to === ROUTES.EXECUTOR.INVITATIONS && pendingInvitations > 0 && (
                  <InvitationCountBadge count={pendingInvitations} />
                )}
              </Link>
            ))}
          </nav>
          <Link
            to={ROUTES.DASHBOARD.ROOT}
            className="mb-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#E0C486] px-4 text-sm font-semibold text-[#0A281E] hover:bg-[#E8CF9B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
          >
            <ArrowLeftRight className="size-4" aria-hidden="true" />
            Sang vai Chủ kho
          </Link>
          <div className="flex items-center gap-3">
            <UserAvatar
              user={user}
              fallbackLetter="N"
              className="size-10 bg-[#E0C486] text-[#0A281E]"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.fullName ?? "Tài khoản"}</p>
              <p className="mt-0.5 text-xs text-[#E6C98B]">Người thực thi</p>
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
        <div className="flex items-center gap-3">
          {badge}
          <NotificationBell />
        </div>
      </header>
      {children}
      <footer className="pt-2 text-xs leading-5 text-heritage-muted">
        LegacyVault hỗ trợ lưu giữ và bàn giao dữ liệu số. Không thay thế di chúc hoặc thủ tục thừa
        kế.
      </footer>
    </WorkspaceShell>
  );
}
