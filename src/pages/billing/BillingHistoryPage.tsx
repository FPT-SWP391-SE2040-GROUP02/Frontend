import { Link } from "react-router-dom";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OrderHistory } from "@/features/billing/ui/OrderHistory";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonVariants } from "@/shared/ui/button";

/** Lịch sử thanh toán của Chủ kho: danh sách đơn do Backend trả (mới nhất trước). */
export function BillingHistoryPage() {
  return (
    <OwnerWorkspace title="Lịch sử thanh toán" description="Các lần thanh toán và đơn của bạn.">
      <div className="flex justify-end">
        <Link
          to={ROUTES.BILLING.PLANS}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Về gói dịch vụ
        </Link>
      </div>
      <OrderHistory />
    </OwnerWorkspace>
  );
}
