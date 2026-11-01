import { ROUTES } from "@/shared/config/routes.config";
import { ROLES } from "@/shared/constants/roles";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

const AssetsManagementPage = lazy(() =>
  import("@/pages/dashboard/AssetsManagementPage").then((module) => ({
    default: module.AssetsManagementPage,
  })),
);
const AssetDetailPage = lazy(() =>
  import("@/pages/dashboard/AssetDetailPage").then((module) => ({
    default: module.AssetDetailPage,
  })),
);
const ContainerDetailPage = lazy(() =>
  import("@/pages/dashboard/ContainerDetailPage").then((module) => ({
    default: module.ContainerDetailPage,
  })),
);
const TrustedPeoplePage = lazy(() =>
  import("@/pages/dashboard/TrustedPeoplePage").then((module) => ({
    default: module.TrustedPeoplePage,
  })),
);
const OwnerIdentityPage = lazy(() =>
  import("@/pages/dashboard/OwnerIdentityPage").then((module) => ({
    default: module.OwnerIdentityPage,
  })),
);
const BeneficiariesPage = lazy(() =>
  import("@/pages/dashboard/BeneficiariesPage").then((module) => ({
    default: module.BeneficiariesPage,
  })),
);
const InvitationPage = lazy(() =>
  import("@/pages/beneficiary/InvitationPage").then((module) => ({
    default: module.InvitationPage,
  })),
);
const ExecutorInvitationPage = lazy(() =>
  import("@/pages/claims/ExecutorInvitationPage").then((module) => ({
    default: module.ExecutorInvitationPage,
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
const ExecutorOverviewPage = lazy(() =>
  import("@/pages/executor/ExecutorOverviewPage").then((module) => ({
    default: module.ExecutorOverviewPage,
  })),
);
const ExecutorReportPage = lazy(() =>
  import("@/pages/executor/ExecutorReportPage").then((module) => ({
    default: module.ExecutorReportPage,
  })),
);
const ExecutorProgressPage = lazy(() =>
  import("@/pages/executor/ExecutorProgressPage").then((module) => ({
    default: module.ExecutorProgressPage,
  })),
);
const ExecutorPermissionsPage = lazy(() =>
  import("@/pages/executor/ExecutorPermissionsPage").then((module) => ({
    default: module.ExecutorPermissionsPage,
  })),
);
const ExecutorSettingsPage = lazy(() =>
  import("@/pages/executor/ExecutorSettingsPage").then((module) => ({
    default: module.ExecutorSettingsPage,
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
const FaqPage = lazy(() =>
  import("@/pages/public/FaqPage").then((module) => ({ default: module.FaqPage })),
);
const ContactPage = lazy(() =>
  import("@/pages/public/ContactPage").then((module) => ({ default: module.ContactPage })),
);
const TermsPage = lazy(() =>
  import("@/pages/public/TermsPage").then((module) => ({ default: module.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import("@/pages/public/PrivacyPage").then((module) => ({ default: module.PrivacyPage })),
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
const VerifierQueuePage = lazy(() =>
  import("@/pages/notary/VerifierQueuePage").then((module) => ({
    default: module.VerifierQueuePage,
  })),
);
const VerifierHistoryPage = lazy(() =>
  import("@/pages/notary/VerifierHistoryPage").then((module) => ({
    default: module.VerifierHistoryPage,
  })),
);
const VerifierCriteriaPage = lazy(() =>
  import("@/pages/notary/VerifierCriteriaPage").then((module) => ({
    default: module.VerifierCriteriaPage,
  })),
);
const VerifierSettingsPage = lazy(() =>
  import("@/pages/notary/VerifierSettingsPage").then((module) => ({
    default: module.VerifierSettingsPage,
  })),
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
const AuditLogPage = lazy(() =>
  import("@/pages/dashboard/AuditLogPage").then((module) => ({ default: module.AuditLogPage })),
);

/** Hiện trong lúc tải file của trang; có chữ và vòng xoay để không bị nhầm với trang trắng. */
function PageLoading() {
  return (
    <div
      role="status"
      aria-label="Đang tải trang"
      className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-[var(--surface,#FAF9F5)]"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary,#0B291E)] border-t-transparent" />
      <p className="text-xs font-medium text-[var(--text-muted,#66786E)]">Đang tải trang…</p>
    </div>
  );
}

/**
 * @description Cấu hình bản đồ định tuyến (Routing map) toàn bộ ứng dụng có phân quyền RBAC.
 * Bao gồm đầy đủ 10 trạng thái vòng đời xác thực & quản lý phiên (Auth & Session Lifecycle).
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* 1. Trang chủ công khai cho GUEST */}
        <Route path={ROUTES.HOME} element={<LandingPage />} />
        <Route path={ROUTES.PUBLIC.FAQ} element={<FaqPage />} />
        <Route path={ROUTES.PUBLIC.CONTACT} element={<ContactPage />} />
        <Route path={ROUTES.PUBLIC.TERMS} element={<TermsPage />} />
        <Route path={ROUTES.PUBLIC.PRIVACY} element={<PrivacyPage />} />
        <Route path="/invitations/:token" element={<InvitationPage />} />
        <Route path={ROUTES.RECEIVE} element={<InvitationPage />} />
        <Route path={ROUTES.EXECUTOR.INVITATION} element={<ExecutorInvitationPage />} />
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path={ROUTES.ADMIN.ROOT} element={<AdminWorkspacePage />} />
          <Route path={ROUTES.ADMIN.AUDIT_LOG} element={<AdminWorkspacePage />} />
          <Route path={ROUTES.DASHBOARD.USERS} element={<AdminWorkspacePage />} />
          <Route
            path="/admin/incidents"
            element={<Navigate to="/admin?view=incidents" replace />}
          />
          <Route path="/admin/holds" element={<Navigate to="/admin?view=holds" replace />} />
          <Route path="/admin/security" element={<Navigate to="/admin?view=security" replace />} />
          <Route path="/admin/users" element={<Navigate to={ROUTES.DASHBOARD.USERS} replace />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.BENEFICIARY.EKYC_CAMERA} element={<CameraCheckPage />} />
          <Route path={ROUTES.BENEFICIARY.CLAIM} element={<BeneficiaryPortalPage />} />
          <Route path={ROUTES.BENEFICIARY.HANDOVER} element={<BeneficiaryPortalPage />} />
        </Route>

        {/* 2. Bảng giá công khai */}
        <Route path={ROUTES.BILLING.PLANS} element={<PricingPlansPage />} />

        {/* 3. Thanh toán và lịch sử hóa đơn yêu cầu đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.BILLING.CHECKOUT} element={<CheckoutPage />} />
          <Route path={ROUTES.BILLING.HISTORY} element={<BillingHistoryPage />} />
          <Route path={ROUTES.DASHBOARD.SETTINGS} element={<AccountSettingsPage />} />
        </Route>

        {/* ========================================================================
          4. TUYẾN ĐƯỜNG XÁC THỰC & QUẢN LÝ PHIÊN (AUTH & SESSION LIFECYCLE)
          10 trạng thái theo thiết kế Mockup
         ======================================================================== */}

        {/* Mockup 1 & 2 & 3 & 4 — Đăng nhập (bình thường / sai / khóa / lời mời) */}
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
        <Route path="/auth/login" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />

        {/* Mockup 5 — Liên kết tài khoản Google */}
        <Route path={ROUTES.AUTH.LINK_GOOGLE} element={<LinkGooglePage />} />

        {/* Mockup 6 — Xác minh Email sau đăng ký / đăng nhập */}
        <Route path={ROUTES.AUTH.VERIFY_EMAIL} element={<VerifyEmailPage />} />
        {/* Đường dẫn email hiện tại do Backend AppUrlProvider tạo. */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Mockup 7 — Xác thực hai bước TOTP dành cho Admin */}
        <Route path={ROUTES.AUTH.TWO_FACTOR} element={<TwoFactorPage />} />

        {/* Mockup 8 — Xác nhận Đăng xuất kèm cảnh báo DMS */}
        <Route path={ROUTES.AUTH.LOGOUT} element={<LogoutConfirmationPage />} />
        <Route path="/auth/logout" element={<Navigate to={ROUTES.AUTH.LOGOUT} replace />} />

        {/* Mockup 9 — Đã Đăng xuất thành công */}
        <Route path={ROUTES.AUTH.LOGGED_OUT} element={<LoggedOutPage />} />

        {/* Mockup 10 — Phiên hết hạn sau 30 phút bất hoạt */}
        <Route path={ROUTES.AUTH.SESSION_EXPIRED} element={<SessionExpiredPage />} />

        {/* Tuyến đường đăng ký và quên mật khẩu */}
        <Route path={ROUTES.AUTH.REGISTER} element={<RegisterPage />} />
        <Route path="/auth/register" element={<Navigate to={ROUTES.AUTH.REGISTER} replace />} />
        <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route
          path="/auth/forgot-password"
          element={<Navigate to={ROUTES.AUTH.FORGOT_PASSWORD} replace />}
        />
        <Route path={ROUTES.AUTH.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

        {/* ========================================================================
          5. TUYẾN ĐƯỜNG BẢO VỆ — Chủ Kho Di Sản (Vault Owner & Admin)
         ======================================================================== */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.USER]} />}>
          <Route path={ROUTES.DASHBOARD.ROOT} element={<OwnerOverviewPage />} />
          <Route path={ROUTES.DASHBOARD.ASSETS} element={<AssetsManagementPage />} />
          <Route path="/dashboard/assets/groups/:id" element={<ContainerDetailPage />} />
          <Route path="/dashboard/assets/:assetId" element={<AssetDetailPage />} />
          <Route path={ROUTES.DASHBOARD.IDENTITY} element={<OwnerIdentityPage />} />
          <Route path={ROUTES.DASHBOARD.BENEFICIARIES} element={<BeneficiariesPage />} />
          <Route path={ROUTES.DASHBOARD.TRUSTED_PEOPLE} element={<TrustedPeoplePage />} />
          <Route path={ROUTES.DASHBOARD.AUDIT_LOG} element={<AuditLogPage />} />
          <Route path="/assets" element={<AssetsManagementPage />} />
          <Route path={ROUTES.WILLS.ROOT} element={<WillManagementPage />} />
          <Route path="/wills" element={<WillManagementPage />} />
          <Route path={ROUTES.WILLS.NEW} element={<WillWizardPage />} />
          <Route path="/dashboard/wills/:id" element={<ContainerDetailPage />} />
          <Route path="/wills/new" element={<WillWizardPage />} />
          <Route path={ROUTES.DMS.ROOT} element={<DmsStatusPage />} />
          <Route path={ROUTES.DMS.CONFIG} element={<DmsStatusPage />} />
          <Route path={ROUTES.DMS.HISTORY} element={<DmsStatusPage />} />
        </Route>

        {/* ========================================================================
          6. TUYẾN ĐƯỜNG BẢO VỆ — Người Thi Hành Di Chúc (Digital Executor)
         ======================================================================== */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.EXECUTOR.ROOT} element={<ExecutorOverviewPage />} />
          <Route path={ROUTES.EXECUTOR.REPORT} element={<ExecutorReportPage />} />
          <Route path={ROUTES.EXECUTOR.PROGRESS} element={<ExecutorProgressPage />} />
          <Route path={ROUTES.EXECUTOR.PERMISSIONS} element={<ExecutorPermissionsPage />} />
          <Route path={ROUTES.EXECUTOR.SETTINGS} element={<ExecutorSettingsPage />} />
          {/* Đường dẫn cũ của cổng Executor. */}
          <Route
            path={ROUTES.EXECUTOR.CLAIM}
            element={<Navigate to={ROUTES.EXECUTOR.ROOT} replace />}
          />
        </Route>

        {/* ========================================================================
          7. TUYẾN ĐƯỜNG BẢO VỆ — Công Chứng Viên (Legal Verifier / Notary)
         ======================================================================== */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.VERIFIER]} />}>
          <Route path={ROUTES.NOTARY.WORKSPACE} element={<NotaryWorkspacePage />} />
          <Route path={ROUTES.NOTARY.QUEUE} element={<VerifierQueuePage />} />
          <Route path={ROUTES.NOTARY.HISTORY} element={<VerifierHistoryPage />} />
          <Route path={ROUTES.NOTARY.CRITERIA} element={<VerifierCriteriaPage />} />
          <Route path={ROUTES.NOTARY.SETTINGS} element={<VerifierSettingsPage />} />
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
