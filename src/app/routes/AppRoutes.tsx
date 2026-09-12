import { Routes, Route, Navigate } from "react-router-dom";
import {
  LandingPage,
  PricingPlansPage,
  BillingHistoryPage,
  DmsStatusPage,
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
      {/* 1. Trang chủ công khai cho GUEST */}
      <Route path={ROUTES.HOME} element={<LandingPage />} />

      {/* 2. Bảng giá & Thanh toán SePay VietQR */}
      <Route path={ROUTES.BILLING.PLANS} element={<PricingPlansPage />} />
      <Route path={ROUTES.BILLING.CHECKOUT} element={<PricingPlansPage />} />
      <Route path={ROUTES.BILLING.HISTORY} element={<BillingHistoryPage />} />

      {/* 3. Dead Man's Switch (Nhịp sinh tồn & bàn giao di sản) */}
      <Route path={ROUTES.DMS.ROOT} element={<DmsStatusPage />} />

      {/* 4. Tuyến đường xác thực (Auth Routes) */}
      <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.AUTH.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

      {/* 3. Tuyến đường lỗi */}
      <Route path={ROUTES.ERROR.FORBIDDEN} element={<ForbiddenPage />} />
      <Route path={ROUTES.ERROR.NOT_FOUND} element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to={ROUTES.ERROR.NOT_FOUND} replace />} />
    </Routes>
  );
}
