import { Fragment, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeftRight, Gift, Mail, Menu, ScanFace, X, type LucideIcon } from "lucide-react";
import {
  OverviewIcon,
  VaultIcon,
  HandoverIcon,
  RecipientsIcon,
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
import { useExecutorVaults } from "@/features/death-case/model/useExecutorVaults";
import { useMyInvitations } from "@/features/plan-setup/model/useMyInvitations";
import { SwitchToRecipientLink } from "@/features/handover/ui/SwitchToRecipientLink";
import { countNeedsAction, useAvailableHandovers } from "@/features/handover-request";
import { getDisplayedServiceTier } from "@/entities/vault/model/vaultServicePresentation";
import { VaultServiceBadge } from "@/entities/vault/ui/VaultServiceInfo";
import {
  isOwnerVaultMissing,
  useOwnerVault,
} from "@/features/vault-management/model/useOwnerVault";
import { getVaultLockReason } from "@/entities/vault/model/vaultLock";
import { OwnerVaultLockedBanner } from "@/features/vault-management/ui/OwnerVaultLockedBanner";
import { AccountMenu } from "./AccountMenu";
import { useNavIndicator } from "./useNavIndicator";
import "./owner-workspace.css";

/** Chỉ mount khi phiên Owner sẵn sàng; dùng chung cache kho với các màn nội dung. */
function OwnerServiceTier() {
  const vault = useOwnerVault(true);
  if (vault.isPending) return <p className="text-sm text-white/65">Đang tải gói…</p>;
  if (vault.isError) {
    if (isOwnerVaultMissing(vault.error)) {
      return <p className="text-sm text-white/65">Chưa có kho</p>;
    }
    return <p className="text-sm text-white/65">Chưa tải được gói</p>;
  }
  return <VaultServiceBadge tier={getDisplayedServiceTier(vault.data)} sidebar />;
}

interface OwnerNavItem {
  label: string;
  to: string;
  icon: LucideIcon | typeof OverviewIcon;
  /** Tiêu đề nhóm hiện phía trên mục đầu tiên của nhóm; "Tổng quan" không thuộc nhóm nào. */
  group?: string;
  /** Mục này hiện số việc cần làm của kho được để lại cho tài khoản. */
  showsReceiveCount?: boolean;
  /** Từ 768px mục nằm trong menu tài khoản ở chân thanh bên; trong danh sách này chỉ còn cho điện thoại. */
  inAccountMenu?: boolean;
}

const GROUP_RECEIVE = "ĐƯỢC ĐỂ LẠI CHO TÔI";
const GROUP_MY_VAULT = "KHO CỦA TÔI";
const GROUP_ACCOUNT = "TÀI KHOẢN";

const navigation: OwnerNavItem[] = [
  { label: "Tổng quan", to: ROUTES.DASHBOARD.ROOT, icon: OverviewIcon },
  {
    label: "Nhận tài sản",
    to: ROUTES.DASHBOARD.RECEIVE_ASSETS,
    icon: Gift,
    group: GROUP_RECEIVE,
    showsReceiveCount: true,
  },
  { label: "Kho của tôi", to: ROUTES.DASHBOARD.ASSETS, icon: VaultIcon, group: GROUP_MY_VAULT },
  { label: "Bàn giao", to: ROUTES.WILLS.ROOT, icon: HandoverIcon, group: GROUP_MY_VAULT },
  {
    label: "Người nhận",
    to: ROUTES.DASHBOARD.BENEFICIARIES,
    icon: RecipientsIcon,
    group: GROUP_MY_VAULT,
  },
  {
    label: "Người thực thi",
    to: ROUTES.DASHBOARD.TRUSTED_PEOPLE,
    icon: TrustedIcon,
    group: GROUP_MY_VAULT,
  },
  { label: "Xác minh", to: ROUTES.DASHBOARD.IDENTITY, icon: ScanFace, group: GROUP_ACCOUNT },
  {
    label: "Nhật ký hoạt động",
    to: ROUTES.DASHBOARD.AUDIT_LOG,
    icon: HistoryIcon,
    group: GROUP_ACCOUNT,
    inAccountMenu: true,
  },
  {
    label: "Gói dịch vụ",
    to: ROUTES.BILLING.PLANS,
    icon: PlanIcon,
    group: GROUP_ACCOUNT,
    inAccountMenu: true,
  },
  {
    label: "Cài đặt",
    to: ROUTES.DASHBOARD.SETTINGS,
    icon: SettingsIcon,
    group: GROUP_ACCOUNT,
    inAccountMenu: true,
  },
];

/** Số kho đang chờ người nhận làm bước tiếp theo; 0 khi chưa đăng nhập, đang tải hoặc lỗi. */
function useReceiveActionCount(): number {
  const available = useAvailableHandovers();
  if (!available.isSuccess) {
    return 0;
  }
  return countNeedsAction(available.data);
}

/**
 * Chỉ tài khoản đang là Executor của ít nhất một kho mới có nút sang vai Người thực thi;
 * không cấp quyền gì, Backend vẫn kiểm tra từng request.
 */
function useCanSwitchToExecutor(): boolean {
  const isAuthenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const vaults = useExecutorVaults(isAuthenticated && Boolean(accessTokenMemory.get()));
  return (vaults.data?.length ?? 0) > 0;
}

/** Số lời mời làm Người thực thi đang chờ; 0 khi chưa đăng nhập, đang tải hoặc lỗi. */
function usePendingInvitationCount(): number {
  const isAuthenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const invitations = useMyInvitations(isAuthenticated && Boolean(accessTokenMemory.get()));
  if (!invitations.isSuccess) return 0;
  return invitations.data.pending.length;
}

export interface OwnerWorkspaceProps {
  title: string;
  /** Nhãn nhỏ phía trên tiêu đề, dùng khi tiêu đề là dữ liệu riêng (ví dụ tên kho). */
  eyebrow?: string;
  description: string;
  headerAction?: ReactNode;
  /** Ẩn dòng lưu ý cuối trang khi trang đã tự hiển thị lưu ý này ở chỗ khác. */
  hideDisclaimer?: boolean;
  children: ReactNode;
}

/** Khung chính thống nhất; logo điều hướng nội bộ và giữ nguyên phiên/cache. */
export function OwnerWorkspace({
  title,
  eyebrow,
  description,
  headerAction,
  hideDisclaimer = false,
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
  const current = navigation.find(
    ({ to }) => path === to || (to !== ROUTES.DASHBOARD.ROOT && path.startsWith(`${to}/`)),
  );
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const showOwnerService = user?.role === "USER" && Boolean(accessTokenMemory.get());
  // Cùng query với ô gói dịch vụ; kho bị khóa thì hiện dải cảnh báo đầu mọi trang.
  const vault = useOwnerVault(showOwnerService);
  const lockReason = getVaultLockReason(vault.data);
  const showSwitchRole = useCanSwitchToExecutor();
  // Lời mời đang chờ hiện ở chân sidebar: người chưa là Executor không có nút chuyển vai để tìm lời mời.
  const pendingInvitations = usePendingInvitationCount();
  const receiveActionCount = useReceiveActionCount();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  useNavIndicator(navRef, indicatorRef, current?.to);
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
              aria-label="Menu Chủ tài sản"
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
            ref={navRef}
            id="owner-navigation"
            aria-label="Điều hướng Chủ tài sản"
            className="owner-navigation owner-navigation--slide"
            data-open={navigationOpen}
          >
            <span ref={indicatorRef} className="owner-nav-indicator" aria-hidden="true" />
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const previous: OwnerNavItem | undefined = navigation[index - 1];
              const startsGroup = item.group !== undefined && item.group !== previous?.group;
              const isCurrent = current?.to === item.to;
              let count = 0;
              if (item.showsReceiveCount === true) {
                count = receiveActionCount;
              }
              let linkClass = "owner-nav-link";
              if (item.inAccountMenu === true) {
                linkClass = "owner-nav-link owner-nav-link--phone-only";
              }
              return (
                <Fragment key={item.to}>
                  {startsGroup && <p className="owner-nav-group">{item.group}</p>}
                  <Link
                    to={item.to}
                    aria-current={isCurrent ? "page" : undefined}
                    className={linkClass}
                    onClick={() => setNavigationOpen(false)}
                  >
                    <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                    {item.label}
                    {count > 0 && <ActionCountBadge count={count} />}
                    {isCurrent && count === 0 && (
                      <span
                        className="ml-auto size-1.5 rounded-full bg-heritage-gold"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                </Fragment>
              );
            })}
            {pendingInvitations > 0 && (
              <Link
                to={ROUTES.DASHBOARD.INVITATIONS}
                // Như nút chuyển vai: từ 768px trở lên nút Lời mời nằm ở chân khung, mục này chỉ cho điện thoại.
                className="owner-nav-link owner-nav-link--phone-only"
                onClick={() => setNavigationOpen(false)}
              >
                <Mail className="size-[18px] shrink-0" aria-hidden="true" />
                Lời mời
                <InvitationCountBadge count={pendingInvitations} />
              </Link>
            )}
            {showSwitchRole && (
              <Link
                to={ROUTES.EXECUTOR.ROOT}
                // Từ 768px trở lên chân khung đã có nút chuyển vai (xem owner-workspace.css), nên mục này chỉ cho điện thoại.
                className="owner-nav-link owner-nav-link--phone-only"
                onClick={() => setNavigationOpen(false)}
              >
                <ArrowLeftRight className="size-[18px] shrink-0" aria-hidden="true" />
                Sang vai Người thực thi
              </Link>
            )}
            <SwitchToRecipientLink
              className="owner-nav-link owner-nav-link--phone-only"
              onNavigate={() => setNavigationOpen(false)}
            />
          </nav>
        </>
      }
      footer={
        <>
          {pendingInvitations > 0 && (
            <Link
              to={ROUTES.DASHBOARD.INVITATIONS}
              aria-current={path === ROUTES.DASHBOARD.INVITATIONS ? "page" : undefined}
              className="mb-3 flex min-h-11 items-center gap-2 rounded-lg border border-heritage-gold-soft/60 bg-white/5 px-3 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
            >
              <Mail className="size-4 shrink-0" aria-hidden="true" />
              Lời mời
              <InvitationCountBadge count={pendingInvitations} />
            </Link>
          )}
          {showSwitchRole && (
            <Link
              to={ROUTES.EXECUTOR.ROOT}
              className="mb-3 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-heritage-gold-soft px-3 text-sm font-semibold text-heritage-primary hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
            >
              <ArrowLeftRight className="size-4 shrink-0" aria-hidden="true" />
              Sang vai Người thực thi
            </Link>
          )}
          <SwitchToRecipientLink className="mb-3 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-heritage-gold-soft px-3 text-sm font-semibold text-heritage-primary hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold" />
          <AccountMenu
            user={user}
            currentPath={path}
            tier={showOwnerService ? <OwnerServiceTier key={user.id} /> : null}
          />
        </>
      }
    >
      <header className="owner-page-header flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-wider text-heritage-muted">
              {eyebrow}
            </p>
          )}
          <h1 className="break-words text-2xl sm:text-3xl font-medium tracking-tight text-heritage-primary">
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-heritage-muted">{description}</p>
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </header>
      {lockReason !== null && <OwnerVaultLockedBanner reason={lockReason} />}
      {children}
      {!hideDisclaimer && (
        <footer className="max-w-prose border-t border-heritage-border pt-4 text-sm leading-5 text-heritage-muted">
          LegacyVault hỗ trợ lưu giữ và bàn giao dữ liệu số. Không thay thế di chúc hoặc thủ tục
          thừa kế.
        </footer>
      )}
    </WorkspaceShell>
  );
}

/** Huy hiệu số kho đang chờ người nhận làm bước tiếp theo, trên mục Nhận tài sản. */
export function ActionCountBadge({ count }: { count: number }) {
  return (
    <span
      aria-label={`${count} việc cần làm`}
      className="ml-auto rounded-full bg-heritage-gold-soft px-2 py-0.5 text-sm font-semibold text-heritage-primary"
    >
      {count}
    </span>
  );
}

/** Huy hiệu đếm lời mời đang chờ trên nút/mục Lời mời. */
export function InvitationCountBadge({ count }: { count: number }) {
  return (
    <span
      aria-label={`${count} lời mời đang chờ`}
      className="ml-auto rounded-full bg-heritage-gold-soft px-2 py-0.5 text-sm font-semibold text-heritage-primary"
    >
      {count}
    </span>
  );
}
