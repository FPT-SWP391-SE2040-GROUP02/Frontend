import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeftRight, Menu, X } from "lucide-react";
import {
  OverviewIcon,
  VaultIcon,
  HandoverIcon,
  RecipientsIcon,
  ActivityIcon,
  HistoryIcon,
  PlanIcon,
  SettingsIcon,
  TrustedIcon,
} from "@/shared/ui/LegacyVaultArtwork";
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
  { label: "Tổng quan", to: ROUTES.DASHBOARD.ROOT, icon: OverviewIcon },
  { label: "Kho của tôi", to: ROUTES.DASHBOARD.ASSETS, icon: VaultIcon },
  { label: "Kế hoạch bàn giao", to: ROUTES.WILLS.ROOT, icon: HandoverIcon },
  { label: "Người nhận", to: ROUTES.DASHBOARD.BENEFICIARIES, icon: RecipientsIcon },
  { label: "Điểm danh", to: ROUTES.DMS.ROOT, icon: ActivityIcon },
  { label: "Nhật ký hoạt động", to: ROUTES.DASHBOARD.AUDIT_LOG, icon: HistoryIcon },
  { label: "Gói dịch vụ", to: ROUTES.BILLING.PLANS, icon: PlanIcon },
  { label: "Cài đặt", to: ROUTES.DASHBOARD.SETTINGS, icon: SettingsIcon },
];

const executorNavigation = [
  { label: "Nhiệm vụ Executor", to: ROUTES.EXECUTOR.CLAIM, icon: HandoverIcon },
];

export interface OwnerWorkspaceProps {
  title: string;
  description: string;
  headerAction?: ReactNode;
  children: ReactNode;
}

/** Khung chính thống nhất; logo điều hướng nội bộ và giữ nguyên phiên/cache. */
export function OwnerWorkspace({
  title,
  description,
  headerAction,
  children,
}: OwnerWorkspaceProps) {
  const accountHome = useAccountHome();
  const location = useLocation();
  const aliases: Record<string, string> = {
    "/assets": ROUTES.DASHBOARD.ASSETS,
    "/wills": ROUTES.WILLS.ROOT,
    "/wills/new": ROUTES.WILLS.NEW,
    [ROUTES.BILLING.HISTORY]: ROUTES.BILLING.PLANS,
  };
  const path = aliases[location.pathname] ?? location.pathname;
  const current = [
    ...navigation,
    ...executorNavigation,
    { label: "Xác minh danh tính", to: ROUTES.DASHBOARD.IDENTITY, icon: TrustedIcon },
  ].find(({ to }) => path === to || (to !== ROUTES.DASHBOARD.ROOT && path.startsWith(`${to}/`)));
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const isExecutor = path.startsWith(ROUTES.EXECUTOR.CLAIM);
  const showOwnerService = !isExecutor && user?.role === "USER" && Boolean(accessTokenMemory.get());
  const home = isExecutor ? ROUTES.EXECUTOR.CLAIM : accountHome;
  const workspaceNavigation = isExecutor ? executorNavigation : navigation;
  const [navigationOpen, setNavigationOpen] = useState(false);
  // Hai vai dùng chung một tài khoản: nút chuyển sang màn của vai còn lại.
  let switchRoleTo: string;
  let switchRoleLabel: string;
  if (isExecutor) {
    switchRoleTo = accountHome;
    switchRoleLabel = "Sang vai Chủ kho";
  } else {
    switchRoleTo = ROUTES.EXECUTOR.CLAIM;
    switchRoleLabel = "Sang vai Người thực hiện";
  }
  const showSwitchRole = user?.role === "USER";
  return (
    <WorkspaceShell
      className="owner-workspace"
      brand="LegacyVault"
      homeHref={home}
      logoutHref={ROUTES.AUTH.LOGOUT}
      logoutLabel="Đăng xuất"
      navigation={
        <>
          <div className="owner-controls md:hidden">
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
            {showSwitchRole && (
              <Link
                to={switchRoleTo}
                className="owner-nav-link lg:hidden"
                onClick={() => setNavigationOpen(false)}
              >
                <ArrowLeftRight className="size-[18px] shrink-0" aria-hidden="true" />
                {switchRoleLabel}
              </Link>
            )}
          </nav>
        </>
      }
      footer={
        <>
          {showSwitchRole && (
            <Link
              to={switchRoleTo}
              className="mb-3 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#E0C486] px-3 text-sm font-semibold text-[#0A281E] hover:bg-[#E6C98B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
            >
              <ArrowLeftRight className="size-4 shrink-0" aria-hidden="true" />
              {switchRoleLabel}
            </Link>
          )}
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E0C486] font-semibold text-[#0A281E]"
              aria-hidden="true"
            >
              {user?.fullName?.trim().charAt(0).toUpperCase() || "T"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user?.fullName ?? "Tài khoản"}
              </p>
              <p className="text-xs text-[#E6C98B]">{isExecutor ? "Người thực hiện" : "Chủ kho"}</p>
              {showOwnerService && (
                <div className="mt-1">
                  <OwnerServiceTier key={user.id} />
                </div>
              )}
            </div>
          </div>
        </>
      }
    >
      <header className="owner-page-header flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-heritage-primary">
            {title}
          </h1>
          <p className="mt-1 text-sm text-heritage-muted">{description}</p>
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </header>
      {children}
      <footer className="border-t border-heritage-border pt-4 text-xs leading-5 text-heritage-muted">
        LegacyVault hỗ trợ lưu giữ và bàn giao dữ liệu số. Không thay thế di chúc hoặc thủ tục thừa
        kế.
      </footer>
    </WorkspaceShell>
  );
}
