import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout, DashboardLayout, AuthLayout } from "@/widgets";
import {
  HomePage,
  LoginPage,
  RegisterPage,
  DashboardOverviewPage,
  AssetsManagementPage,
  NotFoundPage,
  ForbiddenPage,
} from "@/pages";
import { PrivateRoute } from "./guards/PrivateRoute";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * @description Cấu hình bản đồ định tuyến (Routing map) toàn bộ ứng dụng.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Tuyến đường công khai (Public Routes với MainLayout) */}
      <Route element={<MainLayout />}>
        <Route path={ROUTES.HOME} element={<HomePage />} />
      </Route>

      {/* 2. Tuyến đường xác thực (Auth Routes với AuthLayout) */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.AUTH.REGISTER} element={<RegisterPage />} />
      </Route>

      {/* 3. Tuyến đường bảo vệ quản trị (Private Routes với DashboardLayout) */}
      <Route element={<PrivateRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.DASHBOARD.ROOT} element={<DashboardOverviewPage />} />
          <Route path={ROUTES.DASHBOARD.ASSETS} element={<AssetsManagementPage />} />
          <Route path={ROUTES.DASHBOARD.ANALYTICS} element={<DashboardOverviewPage />} />
          <Route path={ROUTES.DASHBOARD.USERS} element={<DashboardOverviewPage />} />
          <Route path={ROUTES.DASHBOARD.SETTINGS} element={<DashboardOverviewPage />} />
        </Route>
      </Route>


      {/* 4. Tuyến đường lỗi */}
      <Route path={ROUTES.ERROR.FORBIDDEN} element={<ForbiddenPage />} />
      <Route path={ROUTES.ERROR.NOT_FOUND} element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to={ROUTES.ERROR.NOT_FOUND} replace />} />
    </Routes>
  );
}
