import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { AdminTwoFactorCard } from "@/features/auth/ui/AdminTwoFactorCard";

/**
 * @description Trang Xác thực hai bước TOTP dành cho Quản trị viên (Mockup 7 - XacThucHaiBuoc.dc.html).
 * Bắt buộc cho mọi phiên đăng nhập có vai trò ADMIN. Cảnh báo phiên tự kết thúc sau 15 phút.
 *
 * @returns {React.JSX.Element} Trang xác thực 2 bước
 */
export function TwoFactorPage() {
  return (
    <HeritageAuthLayout
      sideTitle="Thêm một bước cho tài khoản quản trị."
      sideSubtitle="Mã xác thực giúp bảo vệ các thao tác nhạy cảm, ngay cả khi mật khẩu bị lộ."
      sideBadge="BẢO VỆ TÀI KHOẢN QUẢN TRỊ"
    >
      <AdminTwoFactorCard />
    </HeritageAuthLayout>
  );
}
