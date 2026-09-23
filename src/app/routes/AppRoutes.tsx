import {
  AssetsManagementPage,
  BillingHistoryPage,
  DmsStatusPage,
  ExecutorClaimsPage,
  ForbiddenPage,
  ForgotPasswordPage,
  LandingPage,
  LoginPage,
  NotFoundPage,
  NotaryWorkspacePage,
  PricingPlansPage,
  RegisterPage,
  WillManagementPage,
  WillWizardPage,
} from "@/pages";
import { ROUTES } from "@/shared/config/routes.config";
import { ROLES } from "@/shared/constants/roles";
import { ProtectedRoute } from "./ProtectedRoute";
import { Navigate, Route, Routes } from "react-router-dom";

/**
 * @description Cấu hình bản đồ định tuyến (Routing map) toàn bộ ứng dụng có phân quyền RBAC.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Trang chủ công khai cho GUEST */}
      <Route path={ROUTES.HOME} element={<LandingPage />} />

      {/* 2. Bảng giá công khai */}
      <Route path={ROUTES.BILLING.PLANS} element={<PricingPlansPage />} />
      <Route path={ROUTES.BILLING.CHECKOUT} element={<PricingPlansPage />} />

      {/* 3. Lịch sử hóa đơn thanh toán yêu cầu đăng nhập */}
      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.BILLING.HISTORY} element={<BillingHistoryPage />} />
      </Route>

      {/* 3. Tuyến đường xác thực (Auth Routes) */}
      <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.AUTH.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

      {/* 4. Tuyến đường bảo vệ dành cho Chủ Kho Di Sản (Vault Owner & Admin) */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.OWNER, ROLES.ADMIN]} />}>
        <Route path={ROUTES.DASHBOARD.ASSETS} element={<AssetsManagementPage />} />
        <Route path="/assets" element={<AssetsManagementPage />} />
        <Route path={ROUTES.WILLS.ROOT} element={<WillManagementPage />} />
        <Route path="/wills" element={<WillManagementPage />} />
        <Route path={ROUTES.WILLS.NEW} element={<WillWizardPage />} />
        <Route path="/wills/new" element={<WillWizardPage />} />
        <Route path={ROUTES.DMS.ROOT} element={<DmsStatusPage />} />
      </Route>

      {/* 5. Tuyến đường bảo vệ dành cho Người Thi Hành Di Chúc (Digital Executor) */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.EXECUTOR, ROLES.ADMIN]} />}>
        <Route path={ROUTES.EXECUTOR.CLAIM} element={<ExecutorClaimsPage />} />
      </Route>

      {/* 6. Tuyến đường bảo vệ dành cho Công Chứng Viên (Legal Verifier / Notary) */}
      <Route element={<ProtectedRoute allowedRoles={[ROLES.NOTARY, ROLES.ADMIN]} />}>
        <Route path={ROUTES.NOTARY.WORKSPACE} element={<NotaryWorkspacePage />} />
      </Route>

      {/* 7. Tuyến đường lỗi */}
      <Route path={ROUTES.ERROR.FORBIDDEN} element={<ForbiddenPage />} />
      <Route path={ROUTES.ERROR.NOT_FOUND} element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to={ROUTES.ERROR.NOT_FOUND} replace />} />
    </Routes>
  );
}
