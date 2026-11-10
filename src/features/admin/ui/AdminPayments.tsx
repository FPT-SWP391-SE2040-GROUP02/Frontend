import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { ROUTES } from "@/shared/config/routes.config";
import { useServerNow } from "@/shared/clock/useServerNow";
import {
  PAYMENT_FILTER_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDateTime,
  formatMoney,
  paymentReasonLabel,
} from "../model/admin.content";
import {
  PAYMENT_FILTER_STATUSES,
  type PaymentTransaction,
  type PaymentTransactionStatus,
} from "../model/admin.schema";
import { useAdminPaymentTransactions } from "../model/useAdmin";
import { useAdminPaymentParams } from "../model/useAdminListParams";
import {
  ListDateField,
  ListFilterBar,
  ListPill,
  ListSearchField,
  ListSelectField,
  ListTable,
  ListTableRow,
} from "@/shared/ui/listKit";
import { AdminPagination } from "./AdminPagination";
import { AdminErrorMessage } from "./AdminStateMessage";

const STATUS_STYLES: Record<PaymentTransactionStatus, string> = {
  RECEIVED: "bg-stone-100 text-stone-700 border-stone-300",
  MATCHED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  RECONCILIATION_REQUIRED: "bg-amber-50 text-amber-900 border-amber-300",
  RESOLVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
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

const pad = (value: number) => String(value).padStart(2, "0");
const isoDay = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

type PeriodKey = "day" | "month" | "quarter";

const PERIODS: ReadonlyArray<{ key: PeriodKey; label: string }> = [
  { key: "day", label: "Hôm nay" },
  { key: "month", label: "Tháng này" },
  { key: "quarter", label: "Quý này" },
];

/** Khoảng ngày (yyyy-MM-dd, gồm cả hai đầu) của ngày, tháng hoặc quý chứa `now`. */
function periodRange(key: PeriodKey, now: Date): { from: string; to: string } {
  if (key === "day") return { from: isoDay(now), to: isoDay(now) };
  const first = key === "month" ? now.getMonth() : Math.floor(now.getMonth() / 3) * 3;
  const months = key === "month" ? 1 : 3;
  return {
    from: isoDay(new Date(now.getFullYear(), first, 1)),
    to: isoDay(new Date(now.getFullYear(), first + months, 0)),
  };
}

/**
 * Giao dịch tiền vào qua SePay, chỉ xem (ADMIN-09): bộ lọc trạng thái và trang nằm trên URL.
 * Giao dịch lệch đã tự mở sự cố loại thanh toán; Admin đối chiếu và đóng ở trang Sự cố, không sửa giao dịch ở đây.
 */
export function AdminPayments() {
  const params = useAdminPaymentParams();
  const serverNow = useServerNow();
  return (
    <div className="mt-6 space-y-4">
      <ListFilterBar onClear={params.hasFilters ? params.clearFilters : undefined}>
        <ListSearchField
          label="Tìm giao dịch"
          placeholder="Tìm theo mã đơn hoặc mã tham chiếu"
          value={params.filters.search}
          maxLength={60}
          onCommit={params.setSearch}
        />
        <ListSelectField
          label="Trạng thái"
          value={params.filters.status ?? ""}
          allLabel="Mọi trạng thái"
          options={PAYMENT_FILTER_STATUSES.map((status) => ({
            value: status,
            label: PAYMENT_FILTER_LABELS[status],
          }))}
          onChange={(value) => params.setStatus(value || undefined)}
        />
        <ListSelectField
          label="Môi trường"
          value={params.filters.environment ?? ""}
          allLabel="Mọi môi trường"
          options={[
            { value: "Live", label: "Thật" },
            { value: "Test", label: "Thử nghiệm" },
          ]}
          onChange={(value) => params.setEnvironment(value || undefined)}
        />
        {PERIODS.map((period) => {
          const range = periodRange(period.key, serverNow);
          return (
            <ListPill
              key={period.key}
              pressed={params.filters.from === range.from && params.filters.to === range.to}
              onClick={() => {
                params.setFrom(range.from);
                params.setTo(range.to);
              }}
            >
              {period.label}
            </ListPill>
          );
        })}
        <ListDateField
          label="Từ"
          value={params.filters.from ?? ""}
          onChange={(value) => params.setFrom(value || undefined)}
        />
        <ListDateField
          label="Đến"
          value={params.filters.to ?? ""}
          onChange={(value) => params.setTo(value || undefined)}
        />
      </ListFilterBar>
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
        <h2 id="admin-payments-heading" className="sr-only">
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
      </div>
    );
  return (
    <div
      aria-busy={refreshing}
      className={refreshing ? "opacity-60 transition-opacity" : undefined}
    >
      <p aria-live="polite" className="mb-3 text-sm text-heritage-muted">
        <b>{data.totalCount}</b> dòng
      </p>
      <ListTable
        columns="140px minmax(170px,1fr) minmax(190px,1.2fr) minmax(150px,1fr)"
        headings={["Nhận lúc", "Số tiền · mã đơn", "Trạng thái", "Ngân hàng · tham chiếu"]}
      >
        {data.items.map((transaction) => (
          <PaymentRow key={transaction.id} transaction={transaction} />
        ))}
      </ListTable>
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

/** Viền trái: xanh khi thành công, đỏ khi cần đối chiếu, trơ khi mới nhận. */
function paymentTone(status: PaymentTransactionStatus): "ok" | "bad" | "none" {
  if (status === "MATCHED" || status === "RESOLVED") return "ok";
  return status === "RECONCILIATION_REQUIRED" ? "bad" : "none";
}

function PaymentRow({ transaction }: { transaction: PaymentTransaction }) {
  return (
    <ListTableRow tone={paymentTone(transaction.status)}>
      <div className="flex flex-col items-start gap-2">
        <b className="font-semibold tabular-nums">{formatDateTime(transaction.receivedAt)}</b>
        {transaction.environment === "Test" && (
          <span className="inline-flex items-center rounded-full bg-stone-200 px-3 py-0.5 text-sm font-medium text-stone-700">
            Test
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <b className="font-semibold tabular-nums">
          {formatMoney(transaction.transferAmount, transaction.currency)}
        </b>
        <small className="font-mono text-sm text-heritage-muted">
          {transaction.paymentCode ?? "Không có mã"}
        </small>
      </div>
      <div className="flex flex-col items-start gap-2">
        <StatusBadge status={transaction.status} />
        {transaction.reconciliationReason && (
          <span className="break-words text-sm text-amber-900">
            Lý do: {paymentReasonLabel(transaction.reconciliationReason)}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <b className="font-medium">{transaction.gateway ?? transaction.provider}</b>
        <small className="break-all font-mono text-sm text-heritage-muted">
          {transaction.referenceCode ?? String(transaction.providerTransactionId)}
        </small>
      </div>
    </ListTableRow>
  );
}
