import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonVariants } from "@/shared/ui/button";
/** Không tạo QR, đơn hàng hoặc trạng thái thanh toán giả. */
export function CheckoutPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-6 py-12 text-heritage-text">
      <h1 className="text-2xl font-semibold">Thanh toán chưa khả dụng</h1>
      <p className="text-sm leading-6 text-heritage-muted">
        Dịch vụ chưa mở đăng ký hoặc thanh toán. Không có đơn hàng nào được tạo trên màn hình này.
      </p>
      <Link to={ROUTES.BILLING.PLANS} className={buttonVariants({ variant: "outline" })}>
        Về gói dịch vụ
      </Link>
    </main>
  );
}
