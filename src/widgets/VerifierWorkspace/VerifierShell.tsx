import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Clock,
  FileText,
  Home,
  ListChecks,
  Menu,
  ShieldCheck,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { NotaryCardMissingNotice } from "@/features/notary-card";
import { usePendingRecipientCount } from "@/features/recipient-review";
import { useWaitingCaseSummaries } from "@/features/verifier-review";
import { ROUTES } from "@/shared/config/routes.config";
import { WorkspaceShell } from "@/shared/ui/WorkspaceShell";
import "@/widgets/OwnerWorkspace/owner-workspace.css";
import "@/widgets/ExecutorWorkspace/executor-workspace.css";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Nguồn số việc đang chờ hiện ở huy hiệu; không có thì không có huy hiệu. */
  badge?: "cases" | "recipients";
}

interface NavGroup {
  /** Tiêu đề nhỏ của nhóm; null với mục Tổng quan đứng riêng ở đầu menu. */
  heading: string | null;
  items: NavItem[];
}

/**
 * Menu Người xét duyệt chia theo việc: Tổng quan, Việc cần làm (có huy hiệu số việc chờ), Đã xử lý, Khác.
 * Chỉ đổi chữ hiển thị; đường dẫn giữ nguyên.
 */
const verifierNavigation: NavGroup[] = [
  {
    heading: null,
    items: [{ label: "Tổng quan", to: ROUTES.NOTARY.WORKSPACE, icon: Home }],
  },
  {
    heading: "Việc cần làm",
    items: [
      { label: "Hồ sơ báo tin", to: ROUTES.NOTARY.QUEUE, icon: ListChecks, badge: "cases" },
      {
        label: "Hồ sơ người nhận",
        to: ROUTES.NOTARY.RECIPIENTS,
        icon: Users,
        badge: "recipients",
      },
    ],
  },
  {
    heading: "Đã xử lý",
    items: [
      { label: "Biên bản đã ký", to: ROUTES.NOTARY.DOCUMENTS, icon: FileText },
      { label: "Lịch sử xét duyệt", to: ROUTES.NOTARY.HISTORY, icon: Clock },
    ],
  },
  {
    heading: "Khác",
    items: [
      { label: "Hướng dẫn xét duyệt", to: ROUTES.NOTARY.CRITERIA, icon: ShieldCheck },
      { label: "Tài khoản", to: ROUTES.NOTARY.SETTINGS, icon: User },
    ],
  },
];

const allNavigationItems: NavItem[] = verifierNavigation.flatMap((group) => group.items);

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
  const waitingCases = useWaitingCaseSummaries().waiting.length;
  const waitingRecipients = usePendingRecipientCount();
  const current = allNavigationItems.find(({ to }) =>
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
            {verifierNavigation.map((group) => (
              <div
                key={group.heading ?? "overview"}
                role={group.heading ? "group" : undefined}
                aria-label={group.heading ?? undefined}
                className="contents md:flex md:flex-col md:gap-1"
              >
                {group.heading && (
                  <p className="hidden px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-widest text-[#E6C98B]/70 md:block">
                    {group.heading}
                  </p>
                )}
                {group.items.map(({ to, label, icon: Icon, badge }) => {
                  let count = 0;
                  if (badge === "cases") count = waitingCases;
                  if (badge === "recipients") count = waitingRecipients;
                  return (
                    <Link
                      key={to}
                      to={to}
                      aria-current={current?.to === to ? "page" : undefined}
                      className="owner-nav-link"
                      onClick={() => setNavigationOpen(false)}
                    >
                      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                      {label}
                      {count > 0 && (
                        <span
                          aria-label={`${count} việc đang chờ bạn duyệt`}
                          className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-[#E0C486] px-2 text-xs font-semibold text-[#0A281E]"
                        >
                          {count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
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
      {path !== ROUTES.NOTARY.SETTINGS && <NotaryCardMissingNotice />}
      {children}
    </WorkspaceShell>
  );
}
