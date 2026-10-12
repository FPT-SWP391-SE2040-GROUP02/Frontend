import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { OverviewIcon, TrustedIcon, VaultIcon, MessageIcon } from "@/shared/ui/LegacyVaultArtwork";
import guilloche from "@/shared/assets/auth-guilloche.svg";
import { WorkspaceShell } from "@/shared/ui/WorkspaceShell";

const shell = {
  brand: "LegacyVault",
  menu: "Menu người nhận",
  role: "Người nhận",
  previewUser: "Tài khoản mẫu",
  logout: "Đăng xuất",
  overview: "Tổng quan",
  verify: "Xác minh",
  content: "Nội dung nhận",
  messages: "Lời nhắn",
};

/** Các khu vực giao diện của cổng người nhận. */
export type RecipientSection = "overview" | "verify" | "content" | "messages";

/** Thuộc tính khung cổng người nhận; không chứa dữ liệu hoặc nghiệp vụ bàn giao. */
export interface RecipientLayoutProps {
  active: RecipientSection;
  children: ReactNode;
}

/** Sidebar dùng chung theo UI kit, route preview tách khỏi cổng được bảo vệ. */
export function RecipientLayout({ active, children }: RecipientLayoutProps) {
  const location = useLocation();
  const preview = import.meta.env.DEV && location.pathname.startsWith("/preview/");
  const root = preview ? ROUTES.PREVIEW.BENEFICIARY : ROUTES.BENEFICIARY.CLAIM;
  const verify = preview ? ROUTES.PREVIEW.EKYC_CAMERA : ROUTES.BENEFICIARY.EKYC_CAMERA;
  const items = [
    { id: "overview", label: shell.overview, icon: OverviewIcon, to: root },
    { id: "verify", label: shell.verify, icon: TrustedIcon, to: `${verify}?step=documents` },
    { id: "content", label: shell.content, icon: VaultIcon, to: `${root}?view=content` },
    { id: "messages", label: shell.messages, icon: MessageIcon, to: `${root}?view=messages` },
  ];
  return (
    <WorkspaceShell
      brand={shell.brand}
      homeHref={ROUTES.HOME}
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
          <img
            src={guilloche}
            alt=""
            aria-hidden="true"
            className="mx-auto mb-3 hidden size-16 opacity-40 [@media(min-height:800px)]:block"
          />
          <div>
            <p className="text-sm font-semibold">{preview ? shell.previewUser : shell.role}</p>
            <p className="mt-1 text-xs text-heritage-surface/65">{shell.role}</p>
          </div>
        </>
      }
    >
      {children}
    </WorkspaceShell>
  );
}
