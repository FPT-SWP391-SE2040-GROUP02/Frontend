import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { SessionExpiredCard } from "@/features/auth/ui/SessionExpiredCard";

/**
 * @description Trang Phiên Hết Hạn (Mockup 10 - PhienHetHan.dc.html).
 * Hiển thị khi Axios Interceptor bắt lỗi 401 do phiên hết hạn sau 30 phút bất hoạt.
 *
 * @returns {React.JSX.Element} Trang phiên hết hạn
 */
export function SessionExpiredPage() {
  return (
    <HeritageAuthLayout
      sideTitle="Vì an toàn, chúng tôi đóng phiên khi bạn vắng mặt."
      sideSubtitle="Phiên của người dùng tự kết thúc sau 30 phút không hoạt động."
      sideBadge="BẢO VỆ TỰ ĐỘNG PHIÊN LÀM VIỆC"
    >
      <SessionExpiredCard idleMinutes={30} />
    </HeritageAuthLayout>
  );
}
