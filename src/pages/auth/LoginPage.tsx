import { useState } from "react";
import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { PasskeyEnrollModal } from "@/features/auth/ui/PasskeyEnrollModal";
import { useSearchParams } from "react-router-dom";
import { AUTH_LAYOUT_CONTENT } from "@/features/auth/model/authLayout.content";

/**
 * @description Trang đăng nhập cookie; Google/Passkey chưa tích hợp được báo rõ.
 * URL chỉ cung cấp dấu hiệu có lời mời, không xác minh tên gói/chủ kho hoặc lockout.
 *
 * @returns {React.JSX.Element} Trang đăng nhập
 */
export function LoginPage() {
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState<boolean>(false);
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
        <LoginForm
          onPasskeyClick={() => setIsPasskeyModalOpen(true)}
          invitationContext={invitationContext}
        />
      </HeritageAuthLayout>

      {/* Modal Passkey / WebAuthn FIDO2 */}
      <PasskeyEnrollModal
        isOpen={isPasskeyModalOpen}
        onClose={() => setIsPasskeyModalOpen(false)}
      />
    </>
  );
}
