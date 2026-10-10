import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ScrollText,
  Settings,
  Vault,
  Mail,
  ShieldCheck,
  CreditCard,
  LogOut,
} from "lucide-react";
import { LegacyVaultMark } from "@/shared/ui/LegacyVaultArtwork";
import { ROUTES } from "@/shared/config/routes.config";
import guilloche from "@/shared/assets/auth-guilloche.svg";

const shell = {
  brand: "LegacyVault",
  preview: "Bản xem trước UI · Các thao tác thật chưa được kết nối.",
  menu: "Menu chính",
  user: "Tài khoản mẫu",
  owner: "Chủ kho",
  admin: "Quản trị viên",
  logout: "Đăng xuất",
  unavailable: "Màn hình chưa có trong bản UI này",
  overview: "Tổng quan",
  vault: "Kho của tôi",
  messages: "Lời nhắn",
  recipients: "Người nhận",
  trusted: "Người tin cậy",
  handover: "Bàn giao",
  plans: "Gói dịch vụ",
  settings: "Cài đặt",
};
const icons = {
  overview: LayoutDashboard,
  users: Users,
  requests: ClipboardList,
  audit: ScrollText,
  settings: Settings,
  vault: Vault,
  messages: Mail,
  recipients: Users,
  trusted: ShieldCheck,
  handover: ClipboardList,
  plans: CreditCard,
};

/** Mục điều hướng của khung trang; thiếu to thì chỉ hiển thị mục chưa được dựng. */
export interface WorkspaceNavigationItem {
  id: string;
  label: string;
  to?: string;
}

/** Thuộc tính khung theo vai trò; dữ liệu phiên thuộc các tầng model bên dưới. */
export interface WorkspaceFrameProps {
  title: string;
  description: string;
  preview: boolean;
  children: ReactNode;
  role?: "owner" | "admin";
  active?: string;
  navigation?: WorkspaceNavigationItem[];
}

/** Sidebar và khung nội dung dùng chung, thích ứng màn hẹp bằng menu cuộn ngang. */
export function WorkspaceFrame({
  title,
  description,
  preview,
  children,
  role = "owner",
  active,
  navigation,
}: WorkspaceFrameProps) {
  const ownerItems: WorkspaceNavigationItem[] = [
    {
      id: "overview",
      label: shell.overview,
      to: preview ? ROUTES.PREVIEW.OWNER : ROUTES.DASHBOARD.ROOT,
    },
    { id: "vault", label: shell.vault, to: ROUTES.DASHBOARD.ASSETS },
    { id: "messages", label: shell.messages },
    { id: "recipients", label: shell.recipients },
    { id: "trusted", label: shell.trusted },
    { id: "handover", label: shell.handover },
    { id: "plans", label: shell.plans, to: ROUTES.BILLING.PLANS },
    {
      id: "settings",
      label: shell.settings,
      to: preview ? ROUTES.PREVIEW.SETTINGS : ROUTES.DASHBOARD.SETTINGS,
    },
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
          {(navigation ?? ownerItems).map((item) => {
            const Icon = icons[item.id as keyof typeof icons] ?? LayoutDashboard;
            const className = `flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm ${active === item.id ? "border-l-2 border-heritage-gold bg-heritage-surface/10 font-semibold text-heritage-gold" : "text-heritage-surface/75 hover:bg-heritage-surface/5"}`;
            return item.to ? (
              <Link
                key={item.id}
                to={item.to}
                aria-current={active === item.id ? "page" : undefined}
                className={className}
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            ) : (
              <button
                key={item.id}
                disabled
                title={shell.unavailable}
                className={`${className} disabled:opacity-40`}
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto hidden p-6 lg:block">
          <img
            src={guilloche}
            alt=""
            aria-hidden="true"
            className="mx-auto mb-6 size-40 opacity-40"
          />
          <div className="border-t border-heritage-surface/15 pt-5">
            <p className="text-sm font-semibold">{preview ? shell.user : shell[role]}</p>
            <p className="mt-1 text-xs text-heritage-surface/65">{shell[role]}</p>
          </div>
          <Link
            to={ROUTES.AUTH.LOGOUT}
            className="mt-3 flex min-h-11 items-center gap-2 text-sm text-heritage-surface/75"
          >
            <LogOut className="size-4" aria-hidden="true" />
            {shell.logout}
          </Link>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-heritage-muted">{description}</p>
            <p className="mt-2 text-xs leading-6 text-heritage-muted">{shell.preview}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
