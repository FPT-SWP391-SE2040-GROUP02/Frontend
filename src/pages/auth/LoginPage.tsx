import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { useSearchParams } from "react-router-dom";
import { AUTH_LAYOUT_CONTENT } from "@/features/auth/model/authLayout.content";
import { MAINTENANCE_ADMIN_LOGIN_PARAM, useMaintenanceStatus } from "@/features/maintenance";

/**
 * @description Trang đăng nhập Bearer RAM/refresh cookie; Google dùng GIS, Passkey chưa khả dụng.
 * URL chỉ cung cấp dấu hiệu có lời mời, không xác minh tên gói/chủ kho hoặc lockout.
 * Khi hệ thống bảo trì, lối /login?admin=1 thành trang đăng nhập quản trị chỉ có email và mật khẩu.
 *
 * @returns {React.JSX.Element} Trang đăng nhập
 */
export function LoginPage() {
  const [searchParams] = useSearchParams();
  const { isMaintenance } = useMaintenanceStatus();

  // Only carry the opaque marker; URL package/owner labels are not verified account data.
  const invitationToken = searchParams.get("invitation");
  const invitationContext = invitationToken ? { token: invitationToken } : undefined;
  const adminOnly = isMaintenance && searchParams.get(MAINTENANCE_ADMIN_LOGIN_PARAM) === "1";

  return (
    <>
      <HeritageAuthLayout
        sideTitle={AUTH_LAYOUT_CONTENT.title}
        sideSubtitle={AUTH_LAYOUT_CONTENT.subtitle}
      >
        <LoginForm invitationContext={invitationContext} adminOnly={adminOnly} />
      </HeritageAuthLayout>
    </>
  );
}
