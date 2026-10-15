import type { ReactNode } from "react";
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
} from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { useAccountHome } from "@/entities/user/model/useAccountHome";
import { ROUTES } from "@/shared/config/routes.config";
import { WorkspaceShell } from "@/shared/ui/WorkspaceShell";

const navigation = [
  { label: "Tổng quan", to: ROUTES.DASHBOARD.ROOT, icon: Home },
  { label: "Kho của tôi", to: ROUTES.DASHBOARD.ASSETS, icon: Vault },
  { label: "Kế hoạch bàn giao", to: ROUTES.WILLS.ROOT, icon: Layers3 },
  { label: "Người nhận", to: ROUTES.DASHBOARD.BENEFICIARIES, icon: Users },
  { label: "Điểm danh", to: ROUTES.DMS.ROOT, icon: Activity },
  { label: "Gói dịch vụ", to: ROUTES.BILLING.PLANS, icon: CreditCard },
  { label: "Cài đặt", to: ROUTES.DASHBOARD.SETTINGS, icon: Settings },
  { label: "Nhiệm vụ Executor", to: ROUTES.EXECUTOR.CLAIM, icon: Layers3 },
  { label: "Nội dung được nhận", to: ROUTES.BENEFICIARY.CLAIM, icon: Users },
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
  const home = useAccountHome();
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
  const PageIcon = current?.icon ?? Home;
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  return (
    <WorkspaceShell
      brand="LegacyVault"
      homeHref={home}
      logoutHref={ROUTES.AUTH.LOGOUT}
      logoutLabel="Đăng xuất"
      navigation={
        <nav
          aria-label="Điều hướng Chủ kho"
          className="flex gap-1 overflow-x-auto px-3 pb-4 lg:mt-5 lg:flex-col"
        >
          {navigation.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              aria-current={current?.to === to ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-heritage-gold ${current?.to === to ? "bg-white/10 font-semibold text-heritage-gold" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      }
      footer={
        <>
          <p className="truncate text-sm font-semibold">{user?.fullName ?? "Tài khoản"}</p>
          <p className="mt-1 text-xs text-white/60">Không gian cá nhân</p>
        </>
      }
    >
      <header className="space-y-5 border-b border-heritage-border pb-6">
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
          <span className="hidden rounded-xl border border-heritage-border bg-heritage-surface p-3 text-heritage-gold sm:block">
            <PageIcon className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
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
