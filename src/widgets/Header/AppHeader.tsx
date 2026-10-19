import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAccountHome } from "@/entities/user/model/useAccountHome";
import type { AuthState } from "@/entities/user/model/authSlice";
import { UserAvatarMenu } from "@/entities/user";
import { ROLES } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/config/routes.config";
import { LegacyVaultMark } from "@/shared/ui/LegacyVaultArtwork";
/** Header phụ dùng phiên thật; không có demo toggle, role giả hay đèn trạng thái mặc định. */
export function AppHeader() {
  const home = useAccountHome();
  const { user, isAuthenticated } = useSelector((state: { auth: AuthState }) => state.auth);
  return (
    <header className="border-b border-heritage-border bg-heritage-surface px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link
          to={home}
          aria-label="LegacyVault Trang Chủ"
          className="flex min-h-11 items-center gap-2 rounded-lg font-semibold text-heritage-primary focus-visible:outline-2 focus-visible:outline-heritage-gold"
        >
          <LegacyVaultMark className="size-8" />
          LegacyVault
        </Link>
        <nav aria-label="Điều hướng chính" className="flex items-center gap-4 text-sm">
          <Link to={home} className="inline-flex min-h-11 items-center">
            Tổng quan
          </Link>
          <Link to={ROUTES.BILLING.PLANS} className="inline-flex min-h-11 items-center">
            Gói dịch vụ
          </Link>
          {isAuthenticated ? (
            <UserAvatarMenu
              fullName={user?.fullName}
              email={user?.email}
              role={user?.role ?? ROLES.USER}
            />
          ) : (
            <Link to={ROUTES.AUTH.LOGIN} className="inline-flex min-h-11 items-center">
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
