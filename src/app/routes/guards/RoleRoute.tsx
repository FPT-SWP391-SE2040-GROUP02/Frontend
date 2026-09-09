import { Outlet } from "react-router-dom";
import { type Role } from "@/shared/constants/roles";

/**
 * @description Thuộc tính cấu hình cho RoleRoute guard.
 */
export interface RoleRouteProps {
  /** Danh sách các role được phép truy cập */
  allowedRoles: Role[];
}

/**
 * @description Route Guard bảo vệ các trang theo vai trò (Role-Based Access Control - RBAC).
 * Tuân thủ Quy tắc 7: Để lại logic kiểm tra role cho developer tự hoàn thiện qua // TODO.
 */
export function RoleRoute({ allowedRoles: _allowedRoles }: RoleRouteProps) {
  // TODO: 1. Lấy thông tin currentUser từ Redux Store: const currentUser = useAppSelector(selectCurrentUser)
  // TODO: 2. Kiểm tra nếu !currentUser, chuyển hướng về trang login: <Navigate to={ROUTES.AUTH.LOGIN} replace />
  // TODO: 3. Kiểm tra nếu !_allowedRoles.includes(currentUser.role), chuyển hướng về trang 403: <Navigate to={ROUTES.ERROR.FORBIDDEN} replace />
  // TODO: 4. Nếu thỏa mãn vai trò, render: <Outlet />

  return <Outlet />;
}
