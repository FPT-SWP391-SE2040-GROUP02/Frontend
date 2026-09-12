import { ReactElement } from "react";
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
  const token = storage.getToken();
  const currentUserRole = useAppSelector((state) => state.auth?.user?.role);

  // TODO: 1. Kiểm tra nếu chưa có JWT token trong storage hoặc state -> Điều hướng về Login kèm redirect param:
  // return <Navigate to={`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(location.pathname)}`} replace />;

  if (!token) {
    return <Navigate to={`${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // TODO: 2. Nếu có khai báo allowedRoles, kiểm tra xem currentUserRole có nằm trong danh sách không
  // TODO: 3. Nếu không đủ quyền (ví dụ BENEFICIARY vào trang NOTARY) -> Điều hướng về trang 403 Forbidden:
  // return <Navigate to={ROUTES.ERROR.FORBIDDEN} replace />;

  if (allowedRoles.length > 0 && currentUserRole && !allowedRoles.includes(currentUserRole as Role) && currentUserRole !== "ADMIN") {
    return <Navigate to={ROUTES.ERROR.FORBIDDEN} replace />;
  }

  // TODO: 4. Nếu thỏa mãn toàn bộ điều kiện an ninh, render children hoặc Outlet
  return children ? children : <Outlet />;
}
