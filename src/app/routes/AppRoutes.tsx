import { Routes, Route, Navigate } from "react-router-dom";
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ForbiddenPage,
  NotFoundPage,
} from "@/pages";
import { ProtectedRoute } from "./ProtectedRoute";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Cấu hình bản đồ định tuyến (Routing map) toàn bộ ứng dụng.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Tuyến đường xác thực (Auth Routes) */}
      <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.AUTH.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

      {/* 2. Tuyến đường bảo vệ mẫu (Private Protected Route) */}
      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
      </Route>

      {/* 3. Tuyến đường lỗi */}
      <Route path={ROUTES.ERROR.FORBIDDEN} element={<ForbiddenPage />} />
      <Route path={ROUTES.ERROR.NOT_FOUND} element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to={ROUTES.ERROR.NOT_FOUND} replace />} />
    </Routes>
  );
}
