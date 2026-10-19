import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { LogoutConfirmationCard } from "@/features/auth/ui/LogoutConfirmationCard";
import { useNavigate } from "react-router-dom";

/**
 * @description Trang Xác nhận Đăng xuất (Mockup 8 - XacNhanDangXuat.dc.html).
 * Hiển thị thông tin tài khoản, cảnh báo DMS Heartbeat và tùy chọn revoke toàn bộ phiên.
 *
 * @returns {React.JSX.Element} Trang xác nhận đăng xuất
 */
export function LogoutConfirmationPage() {
  const navigate = useNavigate();

  return (
    <HeritageAuthLayout
      sideTitle="Hẹn gặp lại."
      sideSubtitle="Kho của bạn vẫn được bảo vệ khi bạn đăng xuất. Điểm danh DMS vẫn hoạt động bình thường."
      sideBadge="BẢO VỆ DI SẢN LIÊN TỤC"
    >
      <LogoutConfirmationCard onClose={() => navigate(-1)} />
    </HeritageAuthLayout>
  );
}
