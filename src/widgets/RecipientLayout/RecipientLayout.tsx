import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { Initial } from "@/shared/ui/heritageKit";
import guilloche from "@/shared/assets/auth-guilloche.svg";
import { ROUTES } from "@/shared/config/routes.config";
import { OverviewIcon } from "@/shared/ui/LegacyVaultArtwork";
import { WorkspaceShell } from "@/shared/ui/WorkspaceShell";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight } from "lucide-react";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { useQuery } from "@tanstack/react-query";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";

const shell = {
  brand: "LegacyVault",
  menu: "Menu người nhận",
  role: "Người nhận",
  logout: "Đăng xuất",
  overview: "Tổng quan",
  content: "Nội dung nhận",
  messages: "Lời nhắn",
};

/** Các khu vực giao diện của cổng người nhận. */
export type RecipientSection = "overview" | "content" | "messages";

/** Thuộc tính khung cổng người nhận; không chứa dữ liệu hoặc nghiệp vụ bàn giao. */
export interface RecipientLayoutProps {
  active: RecipientSection;
  children: ReactNode;
}

/** Sidebar dùng chung cho cổng người nhận. */
export function RecipientLayout({ active, children }: RecipientLayoutProps) {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const fullName = user?.fullName;
  // Chỉ tài khoản đã có kho (Chủ kho) mới có nút sang vai Chủ kho; không cấp quyền gì, Backend vẫn kiểm tra từng request.
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
  const items = [{ id: "overview", label: shell.overview, icon: OverviewIcon, to: root }];
  return (
    <WorkspaceShell
      brand={shell.brand}
      homeHref={root}
      logoutHref={ROUTES.AUTH.LOGOUT}
      logoutLabel={shell.logout}
      navigation={
        <nav
          aria-label={shell.menu}
          className="flex shrink-0 gap-1 overflow-x-auto px-3 pb-3 lg:flex-col"
        >
          {items.map(({ id, label, icon: Icon, to }) => (
            <Link
              key={id}
              to={to}
              aria-current={active === id ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-heritage-gold ${active === id ? "border-l-2 border-heritage-gold bg-heritage-surface/10 font-semibold text-heritage-gold" : "text-heritage-surface/80 hover:bg-heritage-surface/10"}`}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      }
      footer={
        <>
          {isOwner && (
            <Link
              to={ROUTES.DASHBOARD.ROOT}
              className="mb-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-heritage-gold-soft px-4 text-sm font-semibold text-heritage-primary hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
            >
              <ArrowLeftRight className="size-4" aria-hidden="true" />
              Sang vai Chủ kho
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
