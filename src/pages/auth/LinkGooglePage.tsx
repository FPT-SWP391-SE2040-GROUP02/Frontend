import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { LinkGoogleAccountCard } from "@/features/auth/ui/LinkGoogleAccountCard";

/**
 * @description Trang Liên kết tài khoản Google (Mockup 5 - LienKetGoogle.dc.html).
 * Hiển thị khi người dùng đăng nhập Google nhưng email đã có tài khoản LegacyVault.
 * Yêu cầu xác nhận mật khẩu hiện tại để hợp nhất tài khoản.
 *
 * @returns {React.JSX.Element} Trang liên kết Google
 */
export function LinkGooglePage() {
  return (
    <HeritageAuthLayout
      sideTitle="Kho của bạn vẫn kín, dù bạn vắng mặt."
      sideSubtitle="Chúng tôi không tự gộp tài khoản chỉ dựa trên email. Bạn xác nhận bằng mật khẩu hiện có."
    >
      <LinkGoogleAccountCard />
    </HeritageAuthLayout>
  );
}
