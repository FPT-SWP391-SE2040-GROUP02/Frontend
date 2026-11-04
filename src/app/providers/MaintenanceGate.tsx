import { useAppSelector } from "@/app/store";
import {
  MAINTENANCE_ADMIN_LOGIN_PARAM,
  MAINTENANCE_CONTENT,
  MAINTENANCE_SETTINGS_HREF,
  MaintenanceNoticeBar,
  MaintenanceScreen,
  useMaintenanceStatus,
} from "@/features/maintenance";
import { ROUTES } from "@/shared/config/routes.config";
import { ROLES } from "@/shared/constants/roles";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

/**
 * Lối vào còn mở cho người chưa đăng nhập khi đang bảo trì: trang đăng nhập quản trị (/login?admin=1)
 * và bước xác thực hai bước của Admin. Backend vẫn tự chặn mọi tài khoản không phải Admin.
 */
function isAdminEntry(pathname: string, search: string): boolean {
  if (pathname === ROUTES.AUTH.TWO_FACTOR) return true;
  if (pathname !== ROUTES.AUTH.LOGIN) return false;
  return new URLSearchParams(search).get(MAINTENANCE_ADMIN_LOGIN_PARAM) === "1";
}

/**
 * Chặn giao diện khi Admin bật chế độ bảo trì:
 * - Admin đã đăng nhập: dùng bình thường, kèm dải nhắc chế độ đang bật.
 * - Trang đăng nhập quản trị: hiện form kèm dải giải thích chỉ Admin vào được.
 * - Mọi trường hợp khác (khách, tài khoản thường kể cả đang có phiên): chỉ hiện màn hình bảo trì.
 * Tự mở lại khi cờ tắt; phiên của tài khoản thường vẫn giữ nếu còn hạn.
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const status = useMaintenanceStatus();
  const user = useAppSelector((state) => state.auth.user);
  const isHydrating = useAppSelector((state) => state.auth.isHydrating);
  const location = useLocation();

  if (!status.isMaintenance) return <>{children}</>;

  if (user?.role === ROLES.ADMIN) {
    return (
      <>
        <MaintenanceNoticeBar
          message={MAINTENANCE_CONTENT.adminBanner}
          actionLabel={MAINTENANCE_CONTENT.adminBannerAction}
          actionHref={MAINTENANCE_SETTINGS_HREF}
        />
        {children}
      </>
    );
  }

  // Đang khôi phục phiên: chưa biết có phải Admin không, tránh nháy màn hình bảo trì trước giao diện Admin.
  if (isHydrating) {
    return (
      <div
        role="status"
        aria-label="Đang kiểm tra phiên đăng nhập"
        className="flex h-screen w-full items-center justify-center bg-heritage-surface"
      >
        <div className="size-8 animate-spin rounded-full border-2 border-heritage-primary border-t-transparent" />
      </div>
    );
  }

  if (isAdminEntry(location.pathname, location.search)) {
    return (
      <>
        <MaintenanceNoticeBar
          message={MAINTENANCE_CONTENT.loginNotice}
          actionLabel={MAINTENANCE_CONTENT.loginNoticeAction}
          actionHref={ROUTES.HOME}
        />
        {children}
      </>
    );
  }

  return <MaintenanceScreen status={status} />;
}
