import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck, Lock } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { Button, buttonVariants } from "@/shared/ui/button";
import { StatusBanner } from "@/shared/ui/status-banner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui";
import type { PaymentOrderStatus } from "../model/billing.types";
import { describeOrder } from "../model/orderLabels";
import { referenceMoney } from "../model/servicePlanPreview";
import { useOrderHistory } from "../model/useBilling";

const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const STATUS_LABELS: Record<PaymentOrderStatus, string> = {
  PAID: "Đã thanh toán",
  PENDING: "Đang chờ thanh toán",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
};

const STATUS_STYLES: Record<PaymentOrderStatus, string> = {
  PAID: "bg-green-100 text-green-800",
  PENDING: "bg-[#F1E7D0] text-[#7A5B24]",
  EXPIRED: "bg-heritage-canvas text-heritage-muted",
  CANCELLED: "bg-heritage-canvas text-heritage-muted",
};

/** Lịch sử thanh toán của kho: mỗi dòng là một đơn, bấm Xem để mở chi tiết (đơn đang chờ thì tiếp tục thanh toán). */
export function OrderHistory() {
  const [page, setPage] = useState(1);
  const history = useOrderHistory(page, true);

  if (history.isPending) return <p role="status">Đang tải lịch sử thanh toán…</p>;
  if (history.isError) {
    return (
      <StatusBanner tone="error">
        <p>Không tải được lịch sử thanh toán.</p>
        <Button
          variant="outline"
          disabled={history.isFetching}
          onClick={() => void history.refetch()}
        >
          Thử lại
        </Button>
      </StatusBanner>
    );
  }
  const data = history.data;
  if (data.totalCount === 0) {
    return (
      <section aria-label="Hóa đơn" className={`${CARD} space-y-4`}>
        <h2 className="text-xl font-medium text-heritage-primary">Hóa đơn</h2>
        <p className="flex items-center gap-3">
          <CircleCheck className="size-5 text-green-700" aria-hidden="true" />
          Bạn chưa có đơn thanh toán nào.
        </p>
        <p className="text-sm text-heritage-muted">
          Khi bạn mua hoặc nâng cấp gói, đơn sẽ hiện ở đây.
        </p>
        <Link
          to={ROUTES.BILLING.PLANS}
          className="inline-flex min-h-11 items-center rounded-xl bg-[#E0C486] px-6 text-sm font-semibold text-[#0A281E] hover:bg-[#E6C98B] focus-visible:outline-2 focus-visible:outline-heritage-gold"
        >
          Xem các gói
        </Link>
      </section>
    );
  }

  return (
    <section aria-label="Hóa đơn" className={`${CARD} space-y-4`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-medium text-heritage-primary">Hóa đơn</h2>
        <span className="text-xs font-semibold text-[#7A5B24]">{data.totalCount} đơn</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Mã</TableHead>
            <TableHead scope="col">Ngày</TableHead>
            <TableHead scope="col">Nội dung</TableHead>
            <TableHead scope="col">Số tiền</TableHead>
            <TableHead scope="col">Trạng thái</TableHead>
            <TableHead scope="col">
              <span className="sr-only">Chi tiết</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs">{order.paymentCode}</TableCell>
              <TableCell>{dateFormatter.format(new Date(order.createdAt))}</TableCell>
              <TableCell className="whitespace-normal">{describeOrder(order)}</TableCell>
              <TableCell>{referenceMoney.format(order.totalAmount)}</TableCell>
              <TableCell>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </TableCell>
              <TableCell>
                <Link
                  to={`${ROUTES.BILLING.CHECKOUT}?order=${order.id}`}
                  aria-label={`Xem đơn ${order.paymentCode}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Xem
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data.totalPages > 1 && (
        <nav
          aria-label="Phân trang lịch sử thanh toán"
          className="flex items-center justify-between gap-3"
        >
          <Button
            variant="outline"
            disabled={!data.hasPreviousPage || history.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Trang trước
          </Button>
          <span className="text-sm">
            Trang {data.pageIndex}/{data.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!data.hasNextPage || history.isFetching}
            onClick={() => setPage(page + 1)}
          >
            Trang sau
          </Button>
        </nav>
      )}
      <p className="flex items-center gap-2 text-xs text-heritage-muted">
        <Lock className="size-3.5" aria-hidden="true" />
        Thanh toán qua mã QR chuyển khoản. LegacyVault không lưu số thẻ.
      </p>
    </section>
  );
}
