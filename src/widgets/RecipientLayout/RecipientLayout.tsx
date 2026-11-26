import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { Initial } from "@/shared/ui/heritageKit";
import guilloche from "@/shared/assets/auth-guilloche.svg";
import { ROUTES } from "@/shared/config/routes.config";
import { WorkspaceShell } from "@/shared/ui/WorkspaceShell";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, BookOpen, FileText, Home } from "lucide-react";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { useQuery } from "@tanstack/react-query";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { useTurnOverview } from "@/features/handover/model/useTurnOverview";
import { StatusDot } from "@/features/handover/ui/portalKit";
import { useSupplementCount } from "@/features/handover-request";

const shell = {
  brand: "LegacyVault",
  menu: "Menu người nhận",
  role: "Người nhận",
  logout: "Đăng xuất",
  overview: "Việc cần làm",
  requests: "Giấy tờ và yêu cầu",
  guide: "Hướng dẫn 6 bước",
  turns: "Các phần tài sản của bạn",
};

/** Các khu vực giao diện của cổng người nhận; "turn" là trang chi tiết một lượt (truyền thêm activeTurnId). */
export type RecipientSection = "overview" | "requests" | "guide" | "turn";

/** Thuộc tính khung cổng người nhận; không chứa dữ liệu hoặc nghiệp vụ bàn giao. */
export interface RecipientLayoutProps {
  active: RecipientSection;
  /** Lượt đang mở ở trang chi tiết, để tô sáng trong danh sách bên trái. */
  activeTurnId?: string;
  children: ReactNode;
}

/** Huy hiệu số việc cần làm trên một mục menu; không có việc thì không hiện. */
function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-heritage-gold-soft px-1.5 text-xs font-bold text-heritage-primary">
      {count}
    </span>
  );
}

/** Sidebar dùng chung cho cổng người nhận. */
export function RecipientLayout({ active, activeTurnId, children }: RecipientLayoutProps) {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const fullName = user?.fullName;
  // Chỉ tài khoản đã có kho (Chủ tài sản) mới có nút sang vai Chủ tài sản; không cấp quyền gì, Backend vẫn kiểm tra từng request.
  // Chỉ ĐỌC kho (getMine), không dùng hook tự tạo kho: người nhận thuần túy không được vô tình có thêm một kho.
  const vault = useQuery({
    queryKey: ["recipient-layout", "owner-vault"],
    queryFn: ({ signal }) => ownerVaultService.getMine(signal),
    enabled: user?.role === "USER" && Boolean(accessTokenMemory.get()),
    retry: false,
    staleTime: 60_000,
  });
  const isOwner = vault.isSuccess;
  const root = ROUTES.BENEFICIARY.CLAIM;
  const overview = useTurnOverview();
  const supplements = useSupplementCount();
  const items = [
    {
      id: "overview",
      label: shell.overview,
      icon: Home,
      to: root,
      badge: overview.urgentCount + supplements,
    },
    {
      id: "requests",
      label: shell.requests,
      icon: FileText,
      to: ROUTES.BENEFICIARY.REQUESTS,
      badge: supplements,
    },
    { id: "guide", label: shell.guide, icon: BookOpen, to: ROUTES.BENEFICIARY.GUIDE, badge: 0 },
  ];
  return (
    <WorkspaceShell
      brand={shell.brand}
      homeHref={root}
      logoutHref={ROUTES.AUTH.LOGOUT}
      logoutLabel={shell.logout}
      variant="admin"
      navigation={
        <>
          <nav
            aria-label={shell.menu}
            className="flex shrink-0 gap-1 overflow-x-auto px-3 pb-3 lg:flex-col"
          >
            {items.map(({ id, label, icon: Icon, to, badge }) => (
              <Link
                key={id}
                to={to}
                aria-current={active === id ? "page" : undefined}
                className={`flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-heritage-gold ${active === id ? "border-l-2 border-heritage-gold bg-heritage-surface/10 font-semibold text-heritage-gold" : "text-heritage-surface/80 hover:bg-heritage-surface/10"}`}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                {label}
                <Badge count={badge} />
              </Link>
            ))}
          </nav>
          {overview.entries.length > 0 && (
            <nav aria-label={shell.turns} className="hidden px-3 pb-3 lg:block">
              <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-widest text-heritage-surface/60">
                {shell.turns}
              </p>
              <ul className="flex flex-col gap-0.5">
                {overview.entries.map(({ turn, view }) => {
                  const current = active === "turn" && activeTurnId === turn.id;
                  return (
                    <li key={turn.id}>
                      <Link
                        to={ROUTES.BENEFICIARY.TURN(turn.id)}
                        aria-current={current ? "page" : undefined}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 focus-visible:outline-2 focus-visible:outline-heritage-gold ${current ? "bg-heritage-surface/10 text-white" : "text-heritage-surface/85 hover:bg-heritage-surface/10"}`}
                      >
                        <StatusDot dot={view.dot} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm leading-tight">
                            {turn.container?.name ?? "Lượt bàn giao"}
                          </span>
                          <small className="block truncate text-xs text-heritage-surface/60">
                            {view.chip}
                          </small>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
        </>
      }
      footer={
        <>
          {isOwner && (
            <Link
              to={ROUTES.DASHBOARD.ROOT}
              className="mb-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-heritage-gold-soft px-4 text-sm font-semibold text-heritage-primary hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
            >
              <ArrowLeftRight className="size-4" aria-hidden="true" />
              Sang vai Chủ tài sản
            </Link>
          )}
          <img
            src={guilloche}
            alt=""
            aria-hidden="true"
            className="mx-auto mb-3 hidden size-16 opacity-40 [@media(min-height:800px)]:block"
          />
          <div className="flex items-center gap-3">
            {fullName && <Initial name={fullName} className="size-10" />}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{fullName ?? shell.role}</p>
              <p className="mt-0.5 text-sm text-heritage-gold">{shell.role}</p>
            </div>
          </div>
        </>
      }
    >
      {children}
    </WorkspaceShell>
  );
}
