import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Route Guard bảo vệ các đường dẫn yêu cầu đăng nhập.
 */
export function PrivateRoute() {
  // TODO: 1. Lấy thông tin trạng thái isAuthenticated từ Redux Store hoặc kiểm tra storage.getToken()
  // TODO: 2. Nếu chưa đăng nhập (false), chuyển hướng về trang login: return <Navigate to={ROUTES.AUTH.LOGIN} replace />
  // TODO: 3. Nếu đã đăng nhập (true), cho phép hiển thị nội dung bên trong: return <Outlet />

  const isAuthenticated = true; // Giá trị tạm thời khi dựng khung skeleton

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  return <Outlet />;
}
