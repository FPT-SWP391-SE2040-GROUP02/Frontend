import { Fragment, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Home,
  ListChecks,
  Lock,
  Mail,
  Menu,
  Package,
  Settings,
  Send,
  X,
  type LucideIcon,
} from "lucide-react";
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
import { ExecutorVaultCard } from "./ExecutorVaultCard";
import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";

const INVITATIONS_LABEL = "Lời mời và tài sản";
/** Dòng giải thích ổ khóa; các mục bị khóa trỏ tới nó qua aria-describedby. */
const LOCKED_NOTE_ID = "executor-locked-note";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Mục chỉ có nghĩa khi đang giữ ít nhất một kho. */
  needsVault?: boolean;
}

/**
 * Menu theo kho đang chọn: Tổng quan, Biên bản bàn giao, Bàn giao, Tài sản và hướng dẫn, Cài đặt. Chưa giữ kho nào
 * thì ba mục cần kho vẫn hiện nhưng mờ, có ổ khóa và không bấm được. "Lời mời và kho" nằm ở chân thanh bên; dưới
 * 768px chân thanh bị ẩn nên có thêm một mục trong menu. Không còn mục Xác minh trong menu (trang vẫn còn, chỉ không
 * có liên kết).
 */
const executorNavigation: NavItem[] = [
  { label: "Tổng quan", to: ROUTES.EXECUTOR.ROOT, icon: Home },
  { label: "Biên bản bàn giao", to: ROUTES.EXECUTOR.REPORT, icon: ListChecks, needsVault: true },
  { label: "Bàn giao", to: ROUTES.EXECUTOR.PROGRESS, icon: Send, needsVault: true },
  { label: "Tài sản và hướng dẫn", to: ROUTES.EXECUTOR.ASSETS, icon: Package, needsVault: true },
  { label: "Cài đặt", to: ROUTES.EXECUTOR.SETTINGS, icon: Settings },
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
  const vaultState = useSelectedExecutorVault();
  // Chỉ khóa khi đã biết chắc là không giữ kho nào; đang tải hay lỗi thì menu vẫn bấm được.
  const noVault = vaultState.query.isSuccess && vaultState.vaults.length === 0;
  const firstVaultItem = executorNavigation.findIndex((item) => item.needsVault);
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
            <ExecutorVaultCard />
            {!noVault && (
              <p className="mt-3 truncate px-3 text-[0.875rem] font-semibold uppercase tracking-widest text-white/60">
                Tài sản này
              </p>
            )}
            {executorNavigation.map(({ to, label, icon: Icon, needsVault }, index) => {
              if (noVault && needsVault) {
                return (
                  <Fragment key={to}>
                    {index === firstVaultItem && (
                      <div className="col-span-2 mt-3 pl-3">
                        <p className="text-[0.875rem] font-semibold uppercase tracking-widest text-white/60">
                          Tài sản này
                        </p>
                        <p id={LOCKED_NOTE_ID} className="mt-1 text-sm text-heritage-gold-soft">
                          Mở khi bạn nhận một tài sản
                        </p>
                      </div>
                    )}
                    <span
                      role="link"
                      aria-disabled="true"
                      aria-describedby={LOCKED_NOTE_ID}
                      className="owner-nav-link executor-nav-locked"
                    >
                      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1">{label}</span>
                      <Lock className="size-3.5 shrink-0" aria-hidden="true" />
                    </span>
                  </Fragment>
                );
              }
              return (
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
              );
            })}
            <Link
              to={ROUTES.EXECUTOR.INVITATIONS}
              aria-current={isCurrent(ROUTES.EXECUTOR.INVITATIONS) ? "page" : undefined}
              className="owner-nav-link owner-nav-link--phone-only"
              onClick={() => setNavigationOpen(false)}
            >
              <Mail className="size-[18px] shrink-0" aria-hidden="true" />
              {INVITATIONS_LABEL}
              {pendingInvitations > 0 && <InvitationCountBadge count={pendingInvitations} />}
            </Link>
          </nav>
        </>
      }
      footer={
        <>
          <nav aria-label="Tài khoản" className="mb-3 flex flex-wrap gap-1">
            <Link
              to={ROUTES.EXECUTOR.INVITATIONS}
              aria-current={isCurrent(ROUTES.EXECUTOR.INVITATIONS) ? "page" : undefined}
              className="flex min-h-9 w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm leading-snug text-heritage-primary-light hover:bg-white/10 aria-[current=page]:bg-white/15 aria-[current=page]:font-semibold"
              onClick={() => setNavigationOpen(false)}
            >
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">{INVITATIONS_LABEL}</span>
              {pendingInvitations > 0 && <InvitationCountBadge count={pendingInvitations} />}
            </Link>
          </nav>
          {/* Người thực thi là nhân sự của hệ thống: không có nút chuyển sang vai Chủ tài sản hay Người nhận. */}
          <div className="flex items-center gap-3">
            <UserAvatar
              user={user}
              fallbackLetter="N"
              className="size-10 bg-heritage-gold-soft text-heritage-primary"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.fullName ?? "Tài khoản"}</p>
              <p className="mt-0.5 text-sm text-heritage-gold-soft">Người thực thi</p>
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
      <footer className="pt-2 text-sm leading-5 text-heritage-muted">
        LegacyVault hỗ trợ lưu giữ và bàn giao dữ liệu số. Không thay thế di chúc hoặc thủ tục thừa
        kế.
      </footer>
    </WorkspaceShell>
  );
}
