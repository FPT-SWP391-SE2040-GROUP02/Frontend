import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { DASHBOARD_GROUPS, formatDateTime } from "../model/admin.content";
import { useAdminDashboard } from "../model/useAdmin";
import { AdminErrorMessage } from "./AdminStateMessage";

/** Tổng quan quản trị: bộ đếm từ GET /admin/dashboard, không đọc nội dung kho. */
export function AdminOverview() {
  const query = useAdminDashboard();

  if (query.isPending)
    return (
      <div role="status" aria-busy="true" aria-label="Đang tải số liệu quản trị" className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );

  if (query.isError)
    return (
      <div className="mt-6">
        <AdminErrorMessage
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      </div>
    );

  const data = query.data;
  return (
    <div className="mt-6 space-y-6" aria-busy={query.isFetching}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-heritage-muted">
          Cập nhật lúc <time dateTime={data.serverTime}>{formatDateTime(data.serverTime)}</time>{" "}
          (giờ máy chủ)
        </p>
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCw
            className={`size-4 ${query.isFetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Tải lại
        </Button>
      </div>
      {DASHBOARD_GROUPS.map((group) => (
        <section key={group.id} aria-labelledby={`admin-group-${group.id}`} className="space-y-3">
          <h2
            id={`admin-group-${group.id}`}
            className="text-xs font-semibold uppercase tracking-wide text-heritage-muted"
          >
            {group.title}
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.counters.map((counter) => {
              const value = data[counter.key];
              const needsAttention = counter.attention && value > 0;
              return (
                <div
                  key={counter.key}
                  className={`rounded-xl border p-4 ${
                    needsAttention
                      ? "border-amber-300 bg-amber-50"
                      : "border-heritage-border bg-heritage-surface"
                  }`}
                >
                  <dt className="text-sm text-heritage-muted">{counter.label}</dt>
                  <dd className="mt-2 flex flex-wrap items-baseline gap-2">
                    <span className="text-3xl font-semibold tabular-nums text-heritage-text">
                      {value}
                    </span>
                    {needsAttention && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900">
                        <AlertTriangle className="size-3.5" aria-hidden="true" />
                        Cần xử lý
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
      <p className="text-xs text-heritage-muted">
        Quản trị viên chỉ xem số liệu vận hành, không đọc được nội dung kho.
      </p>
    </div>
  );
}
