import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { ROUTES } from "@/shared/config/routes.config";
import {
  PAYMENT_STATUS_LABELS,
  formatDateTime,
  formatMoney,
  paymentReasonLabel,
} from "../model/admin.content";
import {
  PAYMENT_TRANSACTION_STATUSES,
  type PaymentTransaction,
  type PaymentTransactionStatus,
} from "../model/admin.schema";
import { useAdminPaymentTransactions } from "../model/useAdmin";
import { useAdminPaymentParams } from "../model/useAdminListParams";
import { AdminPagination } from "./AdminPagination";
import { AdminErrorMessage } from "./AdminStateMessage";

const STATUS_STYLES: Record<PaymentTransactionStatus, string> = {
  RECEIVED: "bg-stone-100 text-stone-700 border-stone-300",
  MATCHED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  RECONCILIATION_REQUIRED: "bg-amber-50 text-amber-900 border-amber-300",
  RESOLVED: "bg-sky-50 text-sky-800 border-sky-200",
};

function StatusBadge({ status }: { status: PaymentTransactionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}

/**
 * Giao dịch tiền vào qua SePay, chỉ xem (ADMIN-09): bộ lọc trạng thái và trang nằm trên URL.
 * Giao dịch lệch đã tự mở sự cố loại thanh toán; Admin đối chiếu và đóng ở trang Sự cố, không sửa giao dịch ở đây.
 */
export function AdminPayments() {
  const params = useAdminPaymentParams();
  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          Trạng thái
          <select
            value={params.filters.status ?? ""}
            onChange={(event) => params.setStatus(event.target.value || undefined)}
            className="mt-1 min-h-11 w-full min-w-48 rounded-lg border border-heritage-border bg-white px-3 text-sm"
          >
            <option value="">Tất cả</option>
            {PAYMENT_TRANSACTION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PAYMENT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p role="note" className="text-sm text-heritage-muted">
        Giao dịch cần đối chiếu đã tự mở sự cố; xử lý ở trang{" "}
        <Link
          className="font-medium text-heritage-primary underline"
          to={`${ROUTES.ADMIN.ROOT}?view=incidents&type=PAYMENT`}
        >
          Sự cố
        </Link>
        . Trang này chỉ xem, không sửa giao dịch hay ghi nhận thanh toán.
      </p>
      <section aria-labelledby="admin-payments-heading" className="space-y-3">
        <h2 id="admin-payments-heading" className="text-lg font-semibold">
          Danh sách giao dịch
        </h2>
        <PaymentResult params={params} />
      </section>
    </div>
  );
}

function PaymentResult({ params }: { params: ReturnType<typeof useAdminPaymentParams> }) {
  const query = useAdminPaymentTransactions(params.query);
  if (query.isPending)
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Đang tải danh sách giao dịch"
        className="space-y-2"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  if (query.isError)
    return (
      <AdminErrorMessage
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
        onResetFilters={params.clearFilters}
      />
    );
  const data = query.data;
  const refreshing = query.isPlaceholderData;
  if (data.totalPages > 0 && params.page > data.totalPages)
    return (
      <div role="status" className="space-y-3 rounded-xl border border-heritage-border p-4">
        <p className="text-sm">Trang {params.page} không tồn tại.</p>
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => params.setPage(data.totalPages)}
        >
          Về trang cuối
        </Button>
      </div>
    );
  if (data.items.length === 0)
    return (
      <div role="status" className="space-y-3 rounded-xl border border-heritage-border p-4">
        <p className="text-sm text-heritage-muted">
          {params.hasFilters ? "Không có giao dịch khớp bộ lọc." : "Hiện chưa có giao dịch nào."}
        </p>
        {params.hasFilters && (
          <Button variant="outline" className="min-h-11" onClick={params.clearFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>
    );
  return (
    <div
      aria-busy={refreshing}
      className={refreshing ? "opacity-60 transition-opacity" : undefined}
    >
      <p aria-live="polite" className="mb-3 text-sm text-heritage-muted">
        {data.totalCount} giao dịch · Trang {data.pageIndex}/{data.totalPages}
      </p>
      <ul className="space-y-2">
        {data.items.map((transaction) => (
          <li key={transaction.id}>
            <PaymentRow transaction={transaction} />
          </li>
        ))}
      </ul>
      <AdminPagination
        label="Phân trang giao dịch"
        pageIndex={data.pageIndex}
        totalPages={data.totalPages}
        hasPreviousPage={data.hasPreviousPage}
        hasNextPage={data.hasNextPage}
        busy={refreshing}
        onPage={params.setPage}
      />
    </div>
  );
}

function PaymentRow({ transaction }: { transaction: PaymentTransaction }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-heritage-border bg-heritage-surface p-4">
      <span className="flex flex-wrap items-center gap-2">
        <span className="font-medium tabular-nums">
          {formatMoney(transaction.transferAmount, transaction.currency)}
        </span>
        <StatusBadge status={transaction.status} />
        {transaction.environment === "Test" && (
          <span className="inline-flex items-center rounded-full border border-stone-300 px-2.5 py-0.5 text-xs text-stone-600">
            Thử nghiệm
          </span>
        )}
      </span>
      {transaction.reconciliationReason && (
        <span className="break-words text-sm text-amber-900">
          Lý do: {paymentReasonLabel(transaction.reconciliationReason)}
        </span>
      )}
      <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-heritage-muted tabular-nums">
        <span>Mã thanh toán: {transaction.paymentCode ?? "Không có"}</span>
        <span>
          Mã giao dịch {transaction.provider}: {transaction.providerTransactionId}
        </span>
        <span>Tiền vào: {formatDateTime(transaction.transactionAt)}</span>
        <span>Nhận lúc: {formatDateTime(transaction.receivedAt)}</span>
      </span>
    </div>
  );
}
