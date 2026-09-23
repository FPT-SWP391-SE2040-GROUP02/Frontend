import { type ReactElement } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/app/store";
import { type Role } from "@/shared/constants/roles";
import { ROUTES } from "@/shared/config/routes.config";
import { storage } from "@/shared/utils";

/**
 * @description Thuộc tính cấu hình cho ProtectedRoute guard.
 */
export interface ProtectedRouteProps {
  /** Danh sách các role được phép truy cập route này (Nếu để trống nghĩa là mọi user đã login đều được vào) */
  allowedRoles?: Role[];
  /** Component tùy chỉnh render thay thế Outlet */
  children?: ReactElement;
}

/**
 * @description Master Route Guard bảo vệ các trang theo trạng thái xác thực và phân quyền RBAC.
 * Tự động chặn người dùng chưa đăng nhập về /login và người dùng sai vai trò về /403.
 *
 * @param {ProtectedRouteProps} props Thuộc tính cấu hình guard
 * @returns {ReactElement} Trả về Outlet hoặc children nếu hợp lệ, ngược lại trả về Navigate
 *
 * @example
 * ```tsx
 * <Route element={<ProtectedRoute allowedRoles={["NOTARY"]} />}>
 *   <Route path="/notary/workspace" element={<NotaryWorkspacePage />} />
 * </Route>
 * ```
 */
export function ProtectedRoute({
  allowedRoles = [],
  children,
}: ProtectedRouteProps): ReactElement {
  const location = useLocation();
  const { isAuthenticated, isHydrating, user } = useAppSelector((state) => state.auth);

  // 1. Trong lúc đang hydrate phiên từ /auth/session -> hiển thị loader trung lập, không đoán role
  if (isHydrating) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--surface,#FAF9F5)] dark:bg-[#06140E]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary,#0B291E)] border-t-transparent" />
          <p className="text-xs font-medium text-[var(--text-muted,#66786E)]">Đang đồng bộ phiên bảo mật...</p>
        </div>
      </div>
    );
  }

  // 2. Kiểm tra nếu chưa đăng nhập -> Điều hướng về Login kèm redirect param:
  if (!isAuthenticated || !user) {
    return <Navigate to={`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // 3. Nếu có khai báo allowedRoles, kiểm tra xem user.role có nằm trong danh sách không
  // Nếu không đủ quyền (ví dụ BENEFICIARY vào trang NOTARY) -> Điều hướng về trang 403 Forbidden:
  const currentUserRole = user.role;
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUserRole) && currentUserRole !== "ADMIN") {
    return <Navigate to={ROUTES.ERROR.FORBIDDEN} replace />;
  }

  return children ? children : <Outlet />;
}
