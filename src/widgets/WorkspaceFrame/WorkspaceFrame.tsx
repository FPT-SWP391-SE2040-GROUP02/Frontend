import type { ReactNode } from "react";
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
  icon?: string;
  /** Tên nhóm hiện phía trên mục đầu tiên của nhóm (ví dụ "Hệ thống"). */
  group?: string;
}
export interface WorkspaceFrameProps {
  title: string;
  description: string;
  children: ReactNode;
  role?: "owner" | "admin";
  active?: string;
  navigation?: WorkspaceNavigationItem[];
}
/** Khung tài khoản, chỉ hiển thị dữ liệu từ phiên đã xác thực. */
export function WorkspaceFrame({
  title,
  description,
  children,
  navigation,
  active,
}: WorkspaceFrameProps) {
  const home = useAccountHome();
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const items = navigation ?? [
    { id: "overview", label: "Tổng quan", to: home },
    { id: "users", label: "Tài khoản", to: ROUTES.DASHBOARD.USERS },
    { id: "audit", label: "Nhật ký hoạt động", to: ROUTES.ADMIN.AUDIT_LOG },
  ];
  return (
    <WorkspaceShell
      brand="LegacyVault"
      homeHref={home}
      logoutHref={ROUTES.AUTH.LOGOUT}
      logoutLabel="Đăng xuất"
      navigation={
        <nav aria-label="Menu chính" className="space-y-1 p-3">
          {items.map((item, index) => {
            const startsGroup = item.group && item.group !== items[index - 1]?.group;
            return (
              <div key={item.id}>
                {startsGroup && (
                  <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-white/50">
                    {item.group}
                  </p>
                )}
                {item.to ? (
                  <Link
                    to={item.to}
                    aria-current={item.id === active ? "page" : undefined}
                    className={`flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-white/10 ${
                      item.id === active ? "bg-white/15 font-semibold" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="block px-3 py-3 text-sm text-white/60">{item.label}</span>
                )}
              </div>
            );
          })}
        </nav>
      }
      footer={<p className="text-sm">{user?.fullName ?? "Tài khoản"}</p>}
    >
      <header>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-heritage-muted">{description}</p>
      </header>
      {children}
    </WorkspaceShell>
  );
}
