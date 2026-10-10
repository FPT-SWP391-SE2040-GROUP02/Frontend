import { ROUTES } from "@/shared/config/routes.config";
import { ROLES } from "@/shared/constants/roles";
import { Skeleton } from "@/shared/ui/skeleton";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

const AssetsManagementPage = lazy(() =>
  import("@/pages/dashboard/AssetsManagementPage").then((module) => ({
    default: module.AssetsManagementPage,
  })),
);
const BillingHistoryPage = lazy(() =>
  import("@/pages/billing/BillingHistoryPage").then((module) => ({
    default: module.BillingHistoryPage,
  })),
);
const DmsStatusPage = lazy(() =>
  import("@/pages/dms/DmsStatusPage").then((module) => ({ default: module.DmsStatusPage })),
);
const ExecutorClaimsPage = lazy(() =>
  import("@/pages/claims/ExecutorClaimsPage").then((module) => ({
    default: module.ExecutorClaimsPage,
  })),
);
const ForbiddenPage = lazy(() =>
  import("@/pages/error/ForbiddenPage").then((module) => ({ default: module.ForbiddenPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("@/pages/auth/ForgotPasswordPage").then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);
const LandingPage = lazy(() =>
  import("@/pages/public/LandingPage").then((module) => ({ default: module.LandingPage })),
);
const LinkGooglePage = lazy(() =>
  import("@/pages/auth/LinkGooglePage").then((module) => ({ default: module.LinkGooglePage })),
);
const LoggedOutPage = lazy(() =>
  import("@/pages/auth/LoggedOutPage").then((module) => ({ default: module.LoggedOutPage })),
);
const LoginPage = lazy(() =>
  import("@/pages/auth/LoginPage").then((module) => ({ default: module.LoginPage })),
);
const LogoutConfirmationPage = lazy(() =>
  import("@/pages/auth/LogoutConfirmationPage").then((module) => ({
    default: module.LogoutConfirmationPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("@/pages/error/NotFoundPage").then((module) => ({ default: module.NotFoundPage })),
);
const ServerErrorPage = lazy(() =>
  import("@/pages/error/ServerErrorPage").then((module) => ({ default: module.ServerErrorPage })),
);
const CameraCheckPage = lazy(() =>
  import("@/pages/ekyc/CameraCheckPage").then((module) => ({ default: module.CameraCheckPage })),
);
const BeneficiaryPortalPage = lazy(() =>
  import("@/pages/beneficiary/BeneficiaryPortalPage").then((module) => ({
    default: module.BeneficiaryPortalPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("@/pages/auth/ResetPasswordPage").then((module) => ({
    default: module.ResetPasswordPage,
  })),
);
const AdminWorkspacePage = lazy(() =>
  import("@/pages/admin/AdminWorkspacePage").then((module) => ({
    default: module.AdminWorkspacePage,
  })),
);
const AccountSettingsPage = lazy(() =>
  import("@/pages/dashboard/AccountSettingsPage").then((module) => ({
    default: module.AccountSettingsPage,
  })),
);
const CheckoutPage = lazy(() =>
  import("@/pages/billing/CheckoutPage").then((module) => ({ default: module.CheckoutPage })),
);
const NotaryWorkspacePage = lazy(() =>
  import("@/pages/notary/NotaryWorkspacePage").then((module) => ({
    default: module.NotaryWorkspacePage,
  })),
);
const PricingPlansPage = lazy(() =>
  import("@/pages/billing/PricingPlansPage").then((module) => ({
    default: module.PricingPlansPage,
  })),
);
const RegisterPage = lazy(() =>
  import("@/pages/auth/RegisterPage").then((module) => ({ default: module.RegisterPage })),
);
const SessionExpiredPage = lazy(() =>
  import("@/pages/auth/SessionExpiredPage").then((module) => ({
    default: module.SessionExpiredPage,
  })),
);
const TwoFactorPage = lazy(() =>
  import("@/pages/auth/TwoFactorPage").then((module) => ({ default: module.TwoFactorPage })),
);
const VerifyEmailPage = lazy(() =>
  import("@/pages/auth/VerifyEmailPage").then((module) => ({ default: module.VerifyEmailPage })),
);
const WillManagementPage = lazy(() =>
  import("@/pages/dashboard/WillManagementPage").then((module) => ({
    default: module.WillManagementPage,
  })),
);
const WillWizardPage = lazy(() =>
  import("@/pages/dashboard/WillWizardPage").then((module) => ({ default: module.WillWizardPage })),
);
const OwnerOverviewPage = lazy(() =>
  import("@/pages/dashboard/OwnerOverviewPage").then((module) => ({
    default: module.OwnerOverviewPage,
  })),
);
const PreviewWorkspace = lazy(() =>
  import("./PreviewWorkspace").then((module) => ({ default: module.PreviewWorkspace })),
);

const CreatePackagePreviewPage = lazy(() =>
  import("@/pages/vault/CreatePackagePreviewPage").then((module) => ({
    default: module.CreatePackagePreviewPage,
  })),
);

/**
 * @description Cấu hình bản đồ định tuyến (Routing map) toàn bộ ứng dụng có phân quyền RBAC.
 * Bao gồm đầy đủ 10 trạng thái vòng đời xác thực & quản lý phiên (Auth & Session Lifecycle).
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<Skeleton className="min-h-screen w-full" aria-label="Đang tải trang" />}>
      <Routes>
        {/* 1. Trang chủ công khai cho GUEST */}
        <Route path={ROUTES.HOME} element={<LandingPage />} />
        {import.meta.env.DEV && (
          <Route path={ROUTES.PREVIEW.OWNER} element={<OwnerOverviewPage />} />
        )}
        {import.meta.env.DEV && (
          <Route path={ROUTES.PREVIEW.EKYC_CAMERA} element={<CameraCheckPage />} />
        )}
        {import.meta.env.DEV && (
          <Route path={ROUTES.PREVIEW.BENEFICIARY} element={<BeneficiaryPortalPage />} />
        )}
        {import.meta.env.DEV && (
          <Route path={ROUTES.PREVIEW.ADMIN} element={<AdminWorkspacePage />} />
        )}
        {import.meta.env.DEV && (
          <Route path={ROUTES.PREVIEW.SETTINGS} element={<AccountSettingsPage />} />
        )}
        {import.meta.env.DEV && <Route path={ROUTES.PREVIEW.CHECKOUT} element={<CheckoutPage />} />}
        {import.meta.env.DEV && (
          <Route
            path={ROUTES.PREVIEW.ASSETS}
            element={
              <PreviewWorkspace>
                <AssetsManagementPage />
              </PreviewWorkspace>
            }
          />
        )}
        {import.meta.env.DEV && (
          <Route
            path={ROUTES.PREVIEW.PLANS}
            element={
              <PreviewWorkspace>
                <WillManagementPage />
              </PreviewWorkspace>
            }
          />
        )}
        {import.meta.env.DEV && (
          <Route
            path={ROUTES.PREVIEW.PLAN_WIZARD}
            element={
              <PreviewWorkspace>
                <WillWizardPage />
              </PreviewWorkspace>
            }
          />
        )}
        {import.meta.env.DEV && (
          <Route
            path={ROUTES.PREVIEW.DMS}
            element={
              <PreviewWorkspace>
                <DmsStatusPage />
              </PreviewWorkspace>
            }
          />
        )}
        {import.meta.env.DEV && (
          <Route
            path={ROUTES.PREVIEW.EXECUTOR}
            element={
              <PreviewWorkspace>
                <ExecutorClaimsPage />
              </PreviewWorkspace>
            }
          />
        )}
        {import.meta.env.DEV && (
          <Route
            path={ROUTES.PREVIEW.VERIFIER}
            element={
              <PreviewWorkspace>
                <NotaryWorkspacePage />
              </PreviewWorkspace>
            }
          />
        )}

        {import.meta.env.DEV && (
          <Route
            path={ROUTES.PREVIEW.PACKAGE_CREATE}
            element={
              <PreviewWorkspace>
                <CreatePackagePreviewPage />
              </PreviewWorkspace>
            }
          />
        )}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path={ROUTES.ADMIN.ROOT} element={<AdminWorkspacePage />} />
          <Route path={ROUTES.ADMIN.AUDIT_LOG} element={<AdminWorkspacePage />} />
          <Route path={ROUTES.DASHBOARD.USERS} element={<AdminWorkspacePage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={[ROLES.BENEFICIARY, ROLES.ADMIN]} />}>
          <Route path={ROUTES.BENEFICIARY.EKYC_CAMERA} element={<CameraCheckPage />} />
          <Route path={ROUTES.BENEFICIARY.CLAIM} element={<BeneficiaryPortalPage />} />
          <Route path={ROUTES.BENEFICIARY.HANDOVER} element={<BeneficiaryPortalPage />} />
        </Route>

        {/* 2. Bảng giá công khai */}
        <Route path={ROUTES.BILLING.PLANS} element={<PricingPlansPage />} />
        <Route path={ROUTES.BILLING.CHECKOUT} element={<CheckoutPage />} />

        {/* 3. Lịch sử hóa đơn thanh toán yêu cầu đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.BILLING.HISTORY} element={<BillingHistoryPage />} />
          <Route path={ROUTES.DASHBOARD.SETTINGS} element={<AccountSettingsPage />} />
        </Route>

        {/* ========================================================================
          4. TUYẾN ĐƯỜNG XÁC THỰC & QUẢN LÝ PHIÊN (AUTH & SESSION LIFECYCLE)
          10 trạng thái theo thiết kế Mockup
         ======================================================================== */}

        {/* Mockup 1 & 2 & 3 & 4 — Đăng nhập (bình thường / sai / khóa / lời mời) */}
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />

        {/* Mockup 5 — Liên kết tài khoản Google */}
        <Route path={ROUTES.AUTH.LINK_GOOGLE} element={<LinkGooglePage />} />

        {/* Mockup 6 — Xác minh Email sau đăng ký / đăng nhập */}
        <Route path={ROUTES.AUTH.VERIFY_EMAIL} element={<VerifyEmailPage />} />

        {/* Mockup 7 — Xác thực hai bước TOTP dành cho Admin */}
        <Route path={ROUTES.AUTH.TWO_FACTOR} element={<TwoFactorPage />} />

        {/* Mockup 8 — Xác nhận Đăng xuất kèm cảnh báo DMS */}
        <Route path={ROUTES.AUTH.LOGOUT} element={<LogoutConfirmationPage />} />

        {/* Mockup 9 — Đã Đăng xuất thành công */}
        <Route path={ROUTES.AUTH.LOGGED_OUT} element={<LoggedOutPage />} />

        {/* Mockup 10 — Phiên hết hạn sau 30 phút bất hoạt */}
        <Route path={ROUTES.AUTH.SESSION_EXPIRED} element={<SessionExpiredPage />} />

        {/* Tuyến đường đăng ký và quên mật khẩu */}
        <Route path={ROUTES.AUTH.REGISTER} element={<RegisterPage />} />
        <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.AUTH.RESET_PASSWORD} element={<ResetPasswordPage />} />

        {/* ========================================================================
          5. TUYẾN ĐƯỜNG BẢO VỆ — Chủ Kho Di Sản (Vault Owner & Admin)
         ======================================================================== */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.OWNER, ROLES.ADMIN]} />}>
          <Route path={ROUTES.DASHBOARD.ROOT} element={<OwnerOverviewPage />} />
          <Route path={ROUTES.DASHBOARD.ASSETS} element={<AssetsManagementPage />} />
          <Route path="/assets" element={<AssetsManagementPage />} />
          <Route path={ROUTES.WILLS.ROOT} element={<WillManagementPage />} />
          <Route path="/wills" element={<WillManagementPage />} />
          <Route path={ROUTES.WILLS.NEW} element={<WillWizardPage />} />
          <Route path="/wills/new" element={<WillWizardPage />} />
          <Route path={ROUTES.DMS.ROOT} element={<DmsStatusPage />} />
        </Route>

        {/* ========================================================================
          6. TUYẾN ĐƯỜNG BẢO VỆ — Người Thi Hành Di Chúc (Digital Executor)
         ======================================================================== */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.EXECUTOR, ROLES.ADMIN]} />}>
          <Route path={ROUTES.EXECUTOR.CLAIM} element={<ExecutorClaimsPage />} />
        </Route>

        {/* ========================================================================
          7. TUYẾN ĐƯỜNG BẢO VỆ — Công Chứng Viên (Legal Verifier / Notary)
         ======================================================================== */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.NOTARY, ROLES.ADMIN]} />}>
          <Route path={ROUTES.NOTARY.WORKSPACE} element={<NotaryWorkspacePage />} />
        </Route>

        {/* ========================================================================
          8. TUYẾN ĐƯỜNG LỖI HỆ THỐNG
         ======================================================================== */}
        <Route path={ROUTES.ERROR.FORBIDDEN} element={<ForbiddenPage />} />
        <Route path={ROUTES.ERROR.NOT_FOUND} element={<NotFoundPage />} />
        <Route path={ROUTES.ERROR.SERVER} element={<ServerErrorPage />} />
        <Route path="*" element={<Navigate to={ROUTES.ERROR.NOT_FOUND} replace />} />
      </Routes>
    </Suspense>
  );
}
