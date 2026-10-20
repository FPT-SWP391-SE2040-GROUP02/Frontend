import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Home,
  Vault,
  Layers3,
  Activity,
  CreditCard,
  Settings,
  ChevronRight,
  Users,
  History,
  Menu,
  X,
} from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { useAccountHome } from "@/entities/user/model/useAccountHome";
import { ROUTES } from "@/shared/config/routes.config";
import { WorkspaceShell } from "@/shared/ui/WorkspaceShell";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VaultServiceBadge } from "@/entities/vault/ui/VaultServiceInfo";
import {
  isOwnerVaultMissing,
  useOwnerVault,
} from "@/features/vault-management/model/useOwnerVault";
import "./owner-workspace.css";

/** Chỉ mount khi phiên Owner sẵn sàng; dùng chung cache kho với các màn nội dung. */
function OwnerServiceTier() {
  const vault = useOwnerVault(true);
  if (vault.isPending) return <p className="text-xs text-white/65">Đang tải gói…</p>;
  if (vault.isError) {
    if (isOwnerVaultMissing(vault.error)) {
      return <p className="text-xs text-white/65">Chưa có kho</p>;
    }
    return <p className="text-xs text-white/65">Chưa tải được gói</p>;
  }
  return <VaultServiceBadge tier={vault.data.serviceTier} sidebar />;
}

const navigation = [
  { label: "Tổng quan", to: ROUTES.DASHBOARD.ROOT, icon: Home },
  { label: "Kho của tôi", to: ROUTES.DASHBOARD.ASSETS, icon: Vault },
  { label: "Kế hoạch bàn giao", to: ROUTES.WILLS.ROOT, icon: Layers3 },
  { label: "Người nhận", to: ROUTES.DASHBOARD.BENEFICIARIES, icon: Users },
  { label: "Điểm danh", to: ROUTES.DMS.ROOT, icon: Activity },
  { label: "Nhật ký hoạt động", to: ROUTES.DASHBOARD.AUDIT_LOG, icon: History },
  { label: "Gói dịch vụ", to: ROUTES.BILLING.PLANS, icon: CreditCard },
  { label: "Cài đặt", to: ROUTES.DASHBOARD.SETTINGS, icon: Settings },
];

const executorNavigation = [
  { label: "Nhiệm vụ Executor", to: ROUTES.EXECUTOR.CLAIM, icon: Layers3 },
];

/** Khung chính thống nhất; logo điều hướng nội bộ và giữ nguyên phiên/cache. */
export function OwnerWorkspace({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const accountHome = useAccountHome();
  const location = useLocation();
  const aliases: Record<string, string> = {
    "/assets": ROUTES.DASHBOARD.ASSETS,
    "/wills": ROUTES.WILLS.ROOT,
    "/wills/new": ROUTES.WILLS.NEW,
    [ROUTES.BILLING.HISTORY]: ROUTES.BILLING.PLANS,
  };
  const path = aliases[location.pathname] ?? location.pathname;
  const current = [...navigation, ...executorNavigation].find(
    ({ to }) => path === to || (to !== ROUTES.DASHBOARD.ROOT && path.startsWith(`${to}/`)),
  );
  const PageIcon = current?.icon ?? Home;
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const isExecutor = path.startsWith(ROUTES.EXECUTOR.CLAIM);
  const showOwnerService = !isExecutor && user?.role === "USER" && Boolean(accessTokenMemory.get());
  const RoleIcon = isExecutor ? Layers3 : Vault;
  const home = isExecutor ? ROUTES.EXECUTOR.CLAIM : accountHome;
  const workspaceNavigation = isExecutor ? executorNavigation : navigation;
  const [navigationOpen, setNavigationOpen] = useState(false);
  return (
    <WorkspaceShell
      className="owner-workspace"
      brand="LegacyVault"
      homeHref={home}
      logoutHref={ROUTES.AUTH.LOGOUT}
      logoutLabel="Đăng xuất"
      navigation={
        <>
          <div className="owner-controls">
            <div className="owner-workspace-label">
              <span className="owner-role-icon">
                <RoleIcon className="size-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold">
                {isExecutor ? "Không gian Executor" : "Không gian Chủ kho"}
              </span>
            </div>
            <button
              type="button"
              className="owner-menu-toggle"
              aria-label={isExecutor ? "Menu Executor" : "Menu Chủ kho"}
              aria-expanded={navigationOpen}
              aria-controls="owner-navigation"
              onClick={() => setNavigationOpen(!navigationOpen)}
            >
              {navigationOpen ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
          <p className="owner-menu-caption">
            {isExecutor ? "Nhiệm vụ được phân công" : "Quản lý kho"}
          </p>
          <nav
            id="owner-navigation"
            aria-label={isExecutor ? "Điều hướng Executor" : "Điều hướng Chủ kho"}
            className="owner-navigation"
            data-open={navigationOpen}
          >
            {workspaceNavigation.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                aria-current={current?.to === to ? "page" : undefined}
                className="owner-nav-link"
                onClick={() => setNavigationOpen(false)}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                {label}
                {current?.to === to && (
                  <span
                    className="ml-auto size-1.5 rounded-full bg-heritage-gold"
                    aria-hidden="true"
                  />
                )}
              </Link>
            ))}
          </nav>
        </>
      }
      footer={
        <>
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 font-semibold text-heritage-gold"
              aria-hidden="true"
            >
              {user?.fullName?.trim().charAt(0).toUpperCase() || "T"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.fullName ?? "Tài khoản"}</p>
              <div className="mt-1">
                {showOwnerService ? (
                  <OwnerServiceTier key={user.id} />
                ) : (
                  <p className="text-xs text-white/65">Không gian cá nhân</p>
                )}
              </div>
            </div>
          </div>
        </>
      }
    >
      <header className="owner-page-header">
        <nav
          aria-label="Đường dẫn trang"
          className="flex min-h-11 items-center gap-2 text-xs text-heritage-muted"
        >
          <Link
            to={home}
            className="inline-flex min-h-11 items-center hover:text-heritage-primary focus-visible:outline-2 focus-visible:outline-heritage-gold"
          >
            Không gian của bạn
          </Link>
          <ChevronRight className="size-3" aria-hidden="true" />
          <span>{current?.label ?? "Tài khoản"}</span>
        </nav>
        <div className="flex items-start gap-4">
          <span className="owner-page-icon">
            <PageIcon className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-heritage-muted">
              {isExecutor ? "Không gian Executor" : "Không gian Chủ kho"}
            </p>
            <h1 className="text-2xl font-semibold text-heritage-primary">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-heritage-muted">{description}</p>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-heritage-border pt-4 text-xs leading-5 text-heritage-muted">
        LegacyVault hỗ trợ lưu giữ và bàn giao dữ liệu số. Không thay thế di chúc hoặc thủ tục thừa
        kế.
      </footer>
    </WorkspaceShell>
  );
}
