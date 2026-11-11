import { useState } from "react";
import { Skeleton } from "@/shared/ui/skeleton";
import { ListPill, ListTable, ListTableRow } from "@/shared/ui/listKit";
import { formatMoney } from "../model/admin.content";
import type { RevenueEnvironment, RevenueGroupBy } from "../model/admin.schema";
import { useAdminRevenue } from "../model/useAdmin";
import { AdminErrorMessage } from "./AdminStateMessage";

const GROUPS: ReadonlyArray<{ key: RevenueGroupBy; label: string }> = [
  { key: "day", label: "Theo ngày" },
  { key: "month", label: "Theo tháng" },
  { key: "quarter", label: "Theo quý" },
];

const ENVIRONMENTS: ReadonlyArray<{ key: RevenueEnvironment; label: string }> = [
  { key: "Live", label: "Tiền thật" },
  { key: "Test", label: "Thử nghiệm" },
  { key: "ALL", label: "Tất cả" },
];

/**
 * Doanh thu = tổng tiền giao dịch đã khớp đơn hoặc đã xử lý (giao dịch lệch chờ đối chiếu chưa tính), tính theo giờ Việt Nam.
 * Khoảng ngày lấy từ bộ lọc của trang Giao dịch; cách gom và môi trường chọn riêng ở đây, mặc định chỉ tiền thật.
 */
export function AdminRevenue({ from, to }: { from?: string; to?: string }) {
  const [groupBy, setGroupBy] = useState<RevenueGroupBy>("month");
  const [environment, setEnvironment] = useState<RevenueEnvironment>("Live");
  const query = useAdminRevenue({ groupBy, environment, from, to });

  return (
    <section
      aria-labelledby="admin-revenue-heading"
      className="space-y-4 rounded-2xl border border-heritage-border bg-[#faf9f5] p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="admin-revenue-heading" className="text-lg font-bold text-heritage-primary">
          Doanh thu
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {GROUPS.map((group) => (
            <ListPill
              key={group.key}
              pressed={groupBy === group.key}
              onClick={() => setGroupBy(group.key)}
            >
              {group.label}
            </ListPill>
          ))}
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-heritage-border" />
          {ENVIRONMENTS.map((item) => (
            <ListPill
              key={item.key}
              pressed={environment === item.key}
              onClick={() => setEnvironment(item.key)}
            >
              {item.label}
            </ListPill>
          ))}
        </div>
      </div>
      <RevenueResult query={query} />
    </section>
  );
}

function RevenueResult({ query }: { query: ReturnType<typeof useAdminRevenue> }) {
  if (query.isPending)
    return (
      <div role="status" aria-busy="true" aria-label="Đang tải doanh thu" className="space-y-2">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    );
  if (query.isError)
    return (
      <AdminErrorMessage
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  const data = query.data;
  const refreshing = query.isPlaceholderData;
  return (
    <div
      aria-busy={refreshing}
      className={refreshing ? "space-y-4 opacity-60 transition-opacity" : "space-y-4"}
    >
      <p aria-live="polite" className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <b className="text-[34px] font-bold leading-[1.15] tabular-nums text-heritage-primary">
          {formatMoney(data.totalAmount, data.currency)}
        </b>
        <span className="text-sm text-heritage-muted">từ {data.transactionCount} giao dịch</span>
      </p>
      {data.buckets.length === 0 && (
        <p role="status" className="text-sm text-heritage-muted">
          Chưa có giao dịch thành công trong khoảng này.
        </p>
      )}
      {data.buckets.length > 0 && (
        <ListTable
          columns="minmax(140px,1fr) 140px minmax(160px,1fr)"
          headings={["Kỳ", "Số giao dịch", "Doanh thu"]}
        >
          {data.buckets.map((bucket) => (
            <ListTableRow key={bucket.key} tone="none">
              <b className="font-semibold tabular-nums">{bucket.label}</b>
              <span className="tabular-nums">{bucket.count}</span>
              <b className="font-semibold tabular-nums">
                {formatMoney(bucket.amount, data.currency)}
              </b>
            </ListTableRow>
          ))}
        </ListTable>
      )}
    </div>
  );
}
