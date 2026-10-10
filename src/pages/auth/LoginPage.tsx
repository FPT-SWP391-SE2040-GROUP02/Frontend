import { useState } from "react";
import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { PasskeyEnrollModal } from "@/features/auth/ui/PasskeyEnrollModal";
import { useSearchParams } from "react-router-dom";

/**
 * @description Trang Đăng nhập tái cấu trúc theo HeritageAuthLayout chuẩn Mockup 1, 2, 3 và 4.
 *
 * - State 1 (Mockup 1): Đăng nhập tiêu chuẩn — Email + Password + Google SSO.
 * - State 2 (Mockup 2): Đăng nhập sai — Banner đỏ báo lỗi kèm số lần thử còn lại (?state=invalid).
 * - State 3 (Mockup 3): Tạm dừng 15 phút — Nút bị khóa, đếm ngược thời gian (?state=locked).
 * - State 4 (Mockup 4): Từ lời mời — Banner xanh ngữ cảnh gói di sản (?invitation=TOKEN).
 *
 * @returns {React.JSX.Element} Trang đăng nhập
 */
export function LoginPage() {
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState<boolean>(false);
  const [searchParams] = useSearchParams();

  // Đọc tham số invitation nếu có để hiển thị ngữ cảnh lời mời (Mockup 4)
  const invitationToken = searchParams.get("invitation");
  const invitationContext = invitationToken
    ? {
        token: invitationToken,
        packageName: searchParams.get("pkg") ?? "Gói di sản",
        inviterName: searchParams.get("from") ?? undefined,
      }
    : undefined;

  return (
    <>
      <HeritageAuthLayout
        sideTitle="Kho của bạn vẫn kín, dù bạn vắng mặt."
        sideSubtitle="Đăng nhập để điểm danh, xem các gói và người nhận. Không ai đọc được tài sản của bạn."
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
