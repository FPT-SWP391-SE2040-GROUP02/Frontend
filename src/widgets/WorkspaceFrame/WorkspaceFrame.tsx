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
} from "lucide-react";
import { WorkspaceShell } from "@/shared/ui/WorkspaceShell";
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
          {(navigation ?? ownerItems).map((item) => {
            const Icon = icons[item.id as keyof typeof icons] ?? LayoutDashboard;
            const className = `flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-heritage-gold ${active === item.id ? "border-l-2 border-heritage-gold bg-heritage-surface/10 font-semibold text-heritage-gold" : "text-heritage-surface/80 hover:bg-heritage-surface/10"}`;
            return item.to ? (
              <Link
                key={item.id}
                to={item.to}
                aria-current={active === item.id ? "page" : undefined}
                className={className}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            ) : (
              <button
                key={item.id}
                disabled
                title={shell.unavailable}
                className={`${className} disabled:opacity-40`}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
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
            <p className="text-sm font-semibold">{preview ? shell.user : shell[role]}</p>
            <p className="mt-1 text-xs text-heritage-surface/65">{shell[role]}</p>
          </div>
        </>
      }
    >
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-heritage-muted">{description}</p>
        <p className="border-l-2 border-heritage-gold pl-3 text-xs leading-5 text-heritage-muted">
          {shell.preview}
        </p>
      </header>
      {children}
    </WorkspaceShell>
  );
}
