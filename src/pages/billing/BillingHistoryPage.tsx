import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
/** Trạng thái chức năng chưa tích hợp; không hiển thị dữ liệu hay thành công giả. */
export function BillingHistoryPage() {
  return (
    <OwnerWorkspace
      title="Lịch sử hóa đơn"
      description="Thông tin trong không gian cá nhân của bạn."
    >
      <section
        role="status"
        className="rounded-xl border border-heritage-border bg-heritage-surface p-6 text-sm leading-6 text-heritage-muted"
      >
        Hệ thống chưa có danh sách đơn đã thanh toán để hiển thị. Đơn đang chờ và kết quả từng đơn
        xem ở trang Thanh toán sau khi bạn tạo đơn.
      </section>
    </OwnerWorkspace>
  );
}
