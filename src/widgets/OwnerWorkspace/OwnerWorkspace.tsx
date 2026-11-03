import { useState, type ComponentType, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "cn";
import { useSelector } from "react-redux";
import { ArrowLeftRight, Lock, Menu, ScanFace, X } from "lucide-react";
import {
  OverviewIcon,
  VaultIcon,
  HandoverIcon,
  RecipientsIcon,
  ActivityIcon,
  HistoryIcon,
  PlanIcon,
  SettingsIcon,
} from "@/shared/ui/LegacyVaultArtwork";
import type { AuthState } from "@/entities/user/model/authSlice";
import { UserAvatar } from "@/entities/user/ui/UserAvatar";
import { useAccountHome } from "@/entities/user/model/useAccountHome";
import { ROUTES } from "@/shared/config/routes.config";
import { WorkspaceShell, WorkspaceTopbar, type BreadcrumbItem } from "@/shared/ui/WorkspaceShell";
import { PageHeader } from "@/shared/ui/PageHeader";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { useExecutorVaults } from "@/features/death-case/model/useExecutorVaults";
import { getDisplayedServiceTier } from "@/entities/vault/model/vaultServicePresentation";
import { VaultServiceBadge } from "@/entities/vault/ui/VaultServiceInfo";
import {
  isOwnerVaultMissing,
  useOwnerVault,
} from "@/features/vault-management/model/useOwnerVault";
import { useOwnerNavLocks } from "./useOwnerNavLocks";
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
  return <VaultServiceBadge tier={getDisplayedServiceTier(vault.data)} sidebar />;
}

interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  /** Mục gộp: bấm vào mở trang đầu, các trang còn lại hiện thành tab trong trang. */
  tabs?: NavItem[];
}

/** Menu gom 3 nhóm, 6 mục: mục gộp mở thành tab bên trong trang để menu vừa một màn. */
const navigationGroups: Array<{ heading: string; items: NavItem[] }> = [
  {
    heading: "Kế hoạch của tôi",
    items: [
      { label: "Tổng quan", to: ROUTES.DASHBOARD.ROOT, icon: OverviewIcon },
      { label: "Tài sản", to: ROUTES.DASHBOARD.ASSETS, icon: VaultIcon },
      { label: "Gói bàn giao", to: ROUTES.DASHBOARD.PACKAGES, icon: HandoverIcon },
      { label: "Người liên quan", to: ROUTES.DASHBOARD.BENEFICIARIES, icon: RecipientsIcon },
    ],
  },
  {
    heading: "Theo dõi",
    items: [{ label: "Điểm danh", to: ROUTES.DMS.ROOT, icon: ActivityIcon }],
  },
  {
    heading: "Tài khoản",
    items: [
      {
        label: "Tài khoản",
        to: ROUTES.DASHBOARD.IDENTITY,
        icon: SettingsIcon,
        tabs: [
          { label: "Xác minh", to: ROUTES.DASHBOARD.IDENTITY, icon: ScanFace },
          { label: "Hạng dịch vụ", to: ROUTES.BILLING.PLANS, icon: PlanIcon },
          { label: "Nhật ký hoạt động", to: ROUTES.DASHBOARD.AUDIT_LOG, icon: HistoryIcon },
          { label: "Cài đặt", to: ROUTES.DASHBOARD.SETTINGS, icon: SettingsIcon },
        ],
      },
    ],
  },
];
const navigation = navigationGroups.flatMap((group) =>
  group.items.flatMap((item) => item.tabs ?? [item]),
);

/**
 * Chỉ tài khoản đang là Executor của ít nhất một kho mới có nút sang vai Người thực hiện;
 * không cấp quyền gì, Backend vẫn kiểm tra từng request.
 */
function useCanSwitchToExecutor(): boolean {
  const isAuthenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const vaults = useExecutorVaults(isAuthenticated && Boolean(accessTokenMemory.get()));
  return (vaults.data?.length ?? 0) > 0;
}

export interface OwnerWorkspaceProps {
  title: string;
  /** Nhãn nhỏ phía trên tiêu đề, dùng khi tiêu đề là dữ liệu riêng (ví dụ tên kho). */
  eyebrow?: string;
  description: string;
  headerAction?: ReactNode;
  children: ReactNode;
}

/** Khung chính thống nhất; logo điều hướng nội bộ và giữ nguyên phiên/cache. */
export function OwnerWorkspace({
  title,
  eyebrow,
  description,
  headerAction,
  children,
}: OwnerWorkspaceProps) {
  const accountHome = useAccountHome();
  const location = useLocation();
  const aliases: Record<string, string> = {
    "/assets": ROUTES.DASHBOARD.ASSETS,
    [ROUTES.BILLING.HISTORY]: ROUTES.BILLING.PLANS,
  };
  const path = aliases[location.pathname] ?? location.pathname;
  const current = navigation.find(
    ({ to }) => path === to || (to !== ROUTES.DASHBOARD.ROOT && path.startsWith(`${to}/`)),
  );
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const showOwnerService = user?.role === "USER" && Boolean(accessTokenMemory.get());
  const showSwitchRole = useCanSwitchToExecutor();
  const locks = useOwnerNavLocks(showOwnerService);
  const currentLock = current ? locks[current.to] : undefined;
  const currentParent = navigationGroups
    .flatMap((group) => group.items)
    .find((item) => item.tabs?.some((tab) => tab.to === current?.to));
  // Điểm danh chỉ hiện sau khi kế hoạch bàn giao đã kích hoạt (máy chủ xác nhận hết là nháp).
  const hideCheckIn = Boolean(locks[ROUTES.DMS.ROOT]) && current?.to !== ROUTES.DMS.ROOT;
  const [navigationOpen, setNavigationOpen] = useState(false);
  const breadcrumb: BreadcrumbItem[] = [{ label: "Tổng quan", to: ROUTES.DASHBOARD.ROOT }];
  if (current && current.to !== ROUTES.DASHBOARD.ROOT) breadcrumb.push({ label: current.label });
  else if (!current) breadcrumb.push({ label: title });
  return (
    <WorkspaceShell
      className="owner-workspace"
      brand="LegacyVault"
      homeHref={accountHome}
      logoutHref={ROUTES.AUTH.LOGOUT}
      logoutLabel="Đăng xuất"
      navigation={
        <>
          <div className="owner-controls md:hidden">
            <button
              type="button"
              className="owner-menu-toggle"
              aria-label="Menu Chủ kho"
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
            aria-label="Điều hướng Chủ kho"
            className="owner-navigation"
            data-open={navigationOpen}
          >
            {navigationGroups.map((group) => (
              <div key={group.heading} className="space-y-1">
                <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wider text-white/55">
                  {group.heading}
                </p>
                {group.items
                  .filter((item) => !(hideCheckIn && item.to === ROUTES.DMS.ROOT))
                  .map(({ to, label, icon: Icon, tabs }) => {
                    const lock = locks[to];
                    const groupActive = tabs ? currentParent?.to === to : false;
                    const reasonId = `nav-lock-${to.replace(/\W+/g, "-")}`;
                    return (
                      <div key={to}>
                        <Link
                          to={to}
                          aria-current={
                            groupActive ? "true" : !tabs && current?.to === to ? "page" : undefined
                          }
                          aria-describedby={lock ? reasonId : undefined}
                          title={lock?.reason}
                          className={cn("owner-nav-link", lock && "opacity-70")}
                          onClick={() => setNavigationOpen(false)}
                        >
                          <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                          {label}
                          {lock && <Lock className="ml-auto size-4 shrink-0" aria-hidden="true" />}
                          {!lock && (groupActive || (!tabs && current?.to === to)) && (
                            <span
                              className="ml-auto size-1.5 rounded-full bg-heritage-gold"
                              aria-hidden="true"
                            />
                          )}
                        </Link>
                        {groupActive &&
                          tabs?.map((tab) => (
                            <Link
                              key={tab.to}
                              to={tab.to}
                              aria-current={current?.to === tab.to ? "page" : undefined}
                              className="owner-nav-link ml-5 min-h-10 text-[13px]"
                              onClick={() => setNavigationOpen(false)}
                            >
                              <tab.icon className="size-4 shrink-0" aria-hidden="true" />
                              {tab.label}
                            </Link>
                          ))}
                        {lock && (
                          <span id={reasonId} className="sr-only">
                            {lock.reason}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            ))}
          </nav>
        </>
      }
      topbar={
        <WorkspaceTopbar
          breadcrumb={breadcrumb}
          roleLabel="Chủ kho"
          roleAction={
            showSwitchRole ? (
              <Link to={ROUTES.EXECUTOR.ROOT} className={cn(buttonStyles.outline, "px-4")}>
                <ArrowLeftRight className="size-4 shrink-0" aria-hidden="true" />
                Sang vai Người thực hiện
              </Link>
            ) : undefined
          }
        />
      }
      footer={
        <>
          <div className="flex items-center gap-3">
            <UserAvatar
              user={user}
              fallbackLetter="T"
              className="size-10 bg-heritage-gold-soft text-heritage-on-gold"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user?.fullName ?? "Tài khoản"}
              </p>
              <p className="text-xs text-heritage-gold-soft-hover">Chủ kho</p>
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
      <PageHeader
        className="owner-page-header"
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={headerAction}
      />
      {currentLock && (
        <Notice
          tone="warning"
          title="Cần làm trước"
          action={
            <Link to={currentLock.unlockHref} className={buttonStyles.dark}>
              Đi tới bước này
            </Link>
          }
        >
          {currentLock.reason}
        </Notice>
      )}
      {children}
      <footer className="border-t border-heritage-border pt-4 text-xs leading-5 text-heritage-muted">
        LegacyVault hỗ trợ lưu giữ và bàn giao dữ liệu số. Không thay thế di chúc hoặc thủ tục thừa
        kế.
      </footer>
    </WorkspaceShell>
  );
}
