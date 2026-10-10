import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import {
  LegacyVaultMark,
  OverviewIcon,
  TrustedIcon,
  VaultIcon,
  MessageIcon,
  LogoutIcon,
} from "@/shared/ui/LegacyVaultArtwork";
import guilloche from "@/shared/assets/auth-guilloche.svg";

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
    <div className="min-h-screen bg-heritage-canvas text-heritage-text lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="flex flex-col bg-heritage-primary text-heritage-surface lg:sticky lg:top-0 lg:h-screen">
        <Link
          to={ROUTES.HOME}
          className="flex min-h-24 items-center gap-3 px-6 text-xl font-semibold"
        >
          <LegacyVaultMark className="size-10" />
          {shell.brand}
        </Link>
        <nav aria-label={shell.menu} className="flex gap-1 overflow-x-auto px-4 pb-4 lg:flex-col">
          {items.map(({ id, label, icon: Icon, to }) => (
            <Link
              key={id}
              to={to}
              aria-current={active === id ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm focus-visible:outline-2 focus-visible:outline-heritage-gold ${active === id ? "border-l-2 border-heritage-gold bg-heritage-surface/10 font-semibold text-heritage-gold" : "text-heritage-surface/75 hover:bg-heritage-surface/5"}`}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden p-6 lg:block">
          <img
            src={guilloche}
            alt=""
            aria-hidden="true"
            className="mx-auto mb-6 size-40 opacity-40"
          />
          <div className="border-t border-heritage-surface/15 pt-5">
            <p className="text-sm font-semibold">{preview ? shell.previewUser : shell.role}</p>
            <p className="mt-1 text-xs text-heritage-surface/65">{shell.role}</p>
          </div>
          <Link
            to={ROUTES.AUTH.LOGOUT}
            className="mt-3 flex min-h-11 items-center gap-2 text-sm text-heritage-surface/75"
          >
            <LogoutIcon className="size-4" />
            {shell.logout}
          </Link>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-6">{children}</div>
      </main>
    </div>
  );
}
