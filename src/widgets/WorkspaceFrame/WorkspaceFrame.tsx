import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { useAccountHome } from "@/entities/user/model/useAccountHome";
import { WorkspaceShell } from "@/shared/ui/WorkspaceShell";
import { ROUTES } from "@/shared/config/routes.config";
export interface WorkspaceNavigationItem {
  id: string;
  label: string;
  to?: string;
  /** Biểu tượng đứng trước tên mục. */
  icon?: LucideIcon;
  /** Số đếm nổi bật bên phải (ví dụ số sự cố cần xử lý); 0 hoặc không có thì không hiện. */
  badge?: number;
  /** Tên nhóm hiện phía trên mục đầu tiên của nhóm (ví dụ "Hệ thống"). */
  group?: string;
}
export interface WorkspaceFrameProps {
  title: string;
  /** Dòng mô tả dưới tiêu đề; để trống thì không hiện. */
  description?: string;
  children: ReactNode;
  role?: "owner" | "admin";
  active?: string;
  navigation?: WorkspaceNavigationItem[];
}

const ROLE_LABELS = { owner: "Chủ kho", admin: "Quản trị viên" } as const;

/** Chữ cái đầu của hai từ cuối trong họ tên, dùng cho ảnh đại diện chữ. */
function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[parts.length - 2], parts[parts.length - 1]] : parts;
  return letters.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}

/** Khung tài khoản, chỉ hiển thị dữ liệu từ phiên đã xác thực. */
export function WorkspaceFrame({
  title,
  description,
  children,
  navigation,
  active,
  role,
}: WorkspaceFrameProps) {
  const home = useAccountHome();
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const items = navigation ?? [
    { id: "overview", label: "Tổng quan", to: home },
    { id: "users", label: "Tài khoản", to: ROUTES.DASHBOARD.USERS },
    { id: "audit", label: "Nhật ký hoạt động", to: ROUTES.ADMIN.AUDIT_LOG },
  ];
  const fullName = user?.fullName ?? "Tài khoản";
  return (
    <WorkspaceShell
      brand="LegacyVault"
      homeHref={home}
      logoutHref={ROUTES.AUTH.LOGOUT}
      logoutLabel="Đăng xuất"
      navigation={
        <nav aria-label="Menu chính" className="space-y-0.5 p-3">
          {items.map((item, index) => {
            const startsGroup = item.group && item.group !== items[index - 1]?.group;
            const isActive = item.id === active;
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {startsGroup && (
                  <p className="px-3 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-[0.09em] text-[#9bb2a5]">
                    {item.group}
                  </p>
                )}
                {item.to ? (
                  <Link
                    to={item.to}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium hover:bg-white/[0.06] ${
                      isActive ? "bg-[rgba(224,196,134,0.16)] text-white" : "text-[#e8efe9]"
                    }`}
                  >
                    {Icon && (
                      <Icon
                        className={`size-[18px] shrink-0 ${isActive ? "text-[#e0c486]" : ""}`}
                        aria-hidden="true"
                      />
                    )}
                    {item.label}
                    {item.badge ? (
                      <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#e0c486] px-1.5 text-[11.5px] font-bold tabular-nums text-[#0a281e]">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                ) : (
                  <span className="block px-3 py-3 text-sm text-white/60">{item.label}</span>
                )}
              </div>
            );
          })}
        </nav>
      }
      footer={
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8dcc6] text-[12.5px] font-semibold text-[#0a281e]"
          >
            {initials(fullName)}
          </span>
          <span className="min-w-0">
            <b className="block truncate text-[13px] font-semibold">{fullName}</b>
            {role && <small className="text-[11.5px] text-[#e0c486]">{ROLE_LABELS[role]}</small>}
          </span>
        </div>
      }
    >
      <header>
        <h1 className="text-[26px] font-bold leading-tight text-heritage-primary">{title}</h1>
        {description && (
          <p className="mt-1 max-w-[62ch] text-sm text-heritage-muted">{description}</p>
        )}
      </header>
      {children}
    </WorkspaceShell>
  );
}
