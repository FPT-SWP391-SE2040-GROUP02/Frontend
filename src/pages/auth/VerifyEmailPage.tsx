import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { VerifyEmailNotice } from "@/features/auth/ui/VerifyEmailNotice";
import { useSearchParams } from "react-router-dom";

/**
 * @description Trang Xác minh Email (Mockup 6 - XacMinhEmail.dc.html).
 * Hiển thị sau khi đăng ký hoặc khi đăng nhập yêu cầu xác minh địa chỉ email.
 *
 * @returns {React.JSX.Element} Trang xác minh email
 */
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <HeritageAuthLayout
      sideTitle="Kho của bạn vẫn kín, dù bạn vắng mặt."
      sideSubtitle="Đăng nhập để điểm danh, xem các gói và người nhận. Không ai đọc được tài sản của bạn."
    >
      <VerifyEmailNotice email={email} />
    </HeritageAuthLayout>
  );
}
