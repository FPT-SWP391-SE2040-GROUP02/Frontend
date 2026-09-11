import { ROUTES } from "@/shared/config/routes.config";
import { ROLES, type Role } from "@/shared/constants";
import { NavLink } from "react-router-dom";
import { Shield, ScrollText, Scale, Vault } from "lucide-react";

/**
 * @description Cấu trúc phần tử trong menu Sidebar.
 */
export interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
}

/**
 * @description Danh mục menu thanh Sidebar trang quản trị (Dashboard).
 */
export const SIDEBAR_ITEMS: SidebarNavItem[] = [
  {
    title: "Di chúc số & Di sản",
    href: ROUTES.DASHBOARD.ROOT,
    icon: ScrollText,
  },
  {
    title: "Két sắt lưu trữ",
    href: ROUTES.DASHBOARD.ANALYTICS,
    icon: Vault,
    roles: [ROLES.ADMIN, ROLES.STAFF],
  },
  {
    title: "Xác thực pháp lý",
    href: ROUTES.DASHBOARD.USERS,
    icon: Scale,
    roles: [ROLES.ADMIN],
  },
  {
    title: "Cấu hình bảo mật",
    href: ROUTES.DASHBOARD.SETTINGS,
    icon: Shield,
    roles: [ROLES.ADMIN],
  },
];

/**
 * @description Sidebar điều hướng cho khu vực Dashboard quản trị.
 */
export function Sidebar() {
  // TODO: 1. Lấy thông tin user hiện tại từ Redux store: const currentUser = useAppSelector(selectCurrentUser)
  // TODO: 2. Lọc danh sách SIDEBAR_ITEMS dựa trên currentUser.role (chỉ hiển thị item mà user có quyền)
  const visibleItems = SIDEBAR_ITEMS;

  return (
    <aside className="w-64 border-r border-border/40 bg-card/50 flex flex-col h-[calc(100vh-4rem)] p-4">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
        Quản trị hệ thống
      </div>
      <nav className="space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === ROUTES.DASHBOARD.ROOT}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
