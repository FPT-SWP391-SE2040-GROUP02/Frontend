import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OrderCheckout } from "@/features/billing/ui/OrderCheckout";
import { useCurrentOrder } from "@/features/billing/model/useBilling";
import { ROUTES } from "@/shared/config/routes.config";
import { Button, buttonVariants } from "@/shared/ui/button";

const orderIdSchema = z.string().uuid();

/** Đơn đang xem lấy từ ?order=<id>; không có thì theo dõi đơn đang chờ của kho. */
function CheckoutContent() {
  const [params] = useSearchParams();
  const parsed = orderIdSchema.safeParse(params.get("order"));
  const current = useCurrentOrder(!parsed.success);
  if (parsed.success) return <OrderCheckout orderId={parsed.data} />;
  if (current.isPending) return <p role="status">Đang kiểm tra đơn đang chờ…</p>;
  if (current.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không tải được đơn thanh toán.</p>
        <Button variant="outline" onClick={() => void current.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }
  if (current.data) return <OrderCheckout orderId={current.data.id} />;
  return (
    <div className="space-y-4 rounded-2xl border border-heritage-border bg-heritage-surface p-6">
      <p className="text-sm text-heritage-muted">
        Bạn chưa có đơn nào đang chờ thanh toán. Chọn gói để tạo đơn.
      </p>
      <Link to={ROUTES.BILLING.PLANS} className={buttonVariants({ variant: "outline" })}>
        Về gói dịch vụ
      </Link>
    </div>
  );
}

/** Thanh toán một đơn: QR, đếm ngược, hủy đơn; mọi trạng thái do Backend xác nhận. */
export function CheckoutPage() {
  return (
    <OwnerWorkspace
      title="Thanh toán"
      description="Hoàn tất thanh toán để cập nhật gói dịch vụ của kho. Thanh toán không tự kích hoạt bàn giao."
    >
      <CheckoutContent />
    </OwnerWorkspace>
  );
}
