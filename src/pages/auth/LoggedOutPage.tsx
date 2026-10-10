import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { LoggedOutCard } from "@/features/auth/ui/LoggedOutCard";

/**
 * @description Trang Đã Đăng Xuất (Mockup 9 - DaDangXuat.dc.html).
 * Hiển thị sau khi người dùng xác nhận đăng xuất thành công, gồm tùy chọn đăng nhập lại và về trang chủ.
 *
 * @returns {React.JSX.Element} Trang đã đăng xuất
 */
export function LoggedOutPage() {
  return (
    <HeritageAuthLayout
      sideTitle="Hẹn gặp lại."
      sideSubtitle="Kho của bạn vẫn được bảo vệ khi bạn đăng xuất. Mọi tài sản đều an toàn."
      sideBadge="PHIÊN ĐÃ KẾT THÚC AN TOÀN"
    >
      <LoggedOutCard />
    </HeritageAuthLayout>
  );
}
