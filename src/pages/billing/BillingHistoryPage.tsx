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
        Hóa đơn sẽ được hiển thị tại đây khi chức năng thanh toán được kết nối. Chưa có dữ liệu hóa
        đơn để hiển thị.
      </section>
    </OwnerWorkspace>
  );
}
