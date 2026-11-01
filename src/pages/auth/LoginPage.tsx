import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { useSearchParams } from "react-router-dom";
import { AUTH_LAYOUT_CONTENT } from "@/features/auth/model/authLayout.content";

/**
 * @description Trang đăng nhập Bearer RAM/refresh cookie; Google dùng GIS, Passkey chưa khả dụng.
 * URL chỉ cung cấp dấu hiệu có lời mời, không xác minh tên gói/chủ kho hoặc lockout.
 *
 * @returns {React.JSX.Element} Trang đăng nhập
 */
export function LoginPage() {
  const [searchParams] = useSearchParams();

  // Only carry the opaque marker; URL package/owner labels are not verified account data.
  const invitationToken = searchParams.get("invitation");
  const invitationContext = invitationToken ? { token: invitationToken } : undefined;

  return (
    <>
      <HeritageAuthLayout
        sideTitle={AUTH_LAYOUT_CONTENT.title}
        sideSubtitle={AUTH_LAYOUT_CONTENT.subtitle}
      >
        <LoginForm invitationContext={invitationContext} />
      </HeritageAuthLayout>
    </>
  );
}
