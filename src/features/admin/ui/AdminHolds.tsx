import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  HOLD_STATUS_LABELS,
  HOLD_TYPE_LABELS,
  formatDateTime,
  holdScopeLabel,
} from "../model/admin.content";
import { HOLD_STATUSES, type Hold, type HoldStatus } from "../model/admin.schema";
import { adminActionError } from "../model/adminError";
import { adminKeys, useAdminHold, useAdminHolds } from "../model/useAdmin";
import { useAdminHoldParams } from "../model/useAdminListParams";
import { PlaceHoldDialog, ReleaseHoldDialog, ReviewHoldDialog } from "./AdminHoldDialogs";
import { AdminPagination } from "./AdminPagination";
import { AdminErrorMessage } from "./AdminStateMessage";

const STATUS_STYLES: Record<HoldStatus, string> = {
  ACTIVE: "bg-amber-50 text-amber-900 border-amber-300",
  RELEASED: "bg-stone-100 text-stone-700 border-stone-300",
};

function StatusBadge({ status }: { status: HoldStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {HOLD_STATUS_LABELS[status]}
    </span>
  );
}

function ReviewOverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-800">
      <AlertTriangle className="size-3.5" aria-hidden="true" />
      Quá hạn rà soát
    </span>
  );
}

/** Danh sách và chi tiết tạm giữ (hold): bộ lọc và hold đang xem nằm trên URL. */
export function AdminHolds() {
  const params = useAdminHoldParams();
  const [placing, setPlacing] = useState(false);
  if (params.selectedId)
    return <HoldDetailView holdId={params.selectedId} onBack={() => params.select(undefined)} />;
  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block text-sm">
          Trạng thái
          <select
            value={params.filters.status ?? ""}
            onChange={(event) => params.setStatus(event.target.value || undefined)}
            className="mt-1 min-h-11 w-full min-w-48 rounded-lg border border-heritage-border bg-white px-3 text-sm"
          >
            <option value="">Tất cả</option>
            {HOLD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {HOLD_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <Button className="min-h-11" onClick={() => setPlacing(true)}>
          Đặt tạm giữ
        </Button>
      </div>
      <section aria-labelledby="admin-holds-heading" className="space-y-3">
        <h2 id="admin-holds-heading" className="text-lg font-semibold">
          Danh sách tạm giữ
        </h2>
        <HoldResult params={params} />
      </section>
      {placing && (
        <PlaceHoldDialog
          onClose={() => setPlacing(false)}
          onDone={(hold) => params.select(hold.id)}
        />
      )}
    </div>
  );
}

function HoldResult({ params }: { params: ReturnType<typeof useAdminHoldParams> }) {
  const query = useAdminHolds(params.query);
  if (query.isPending)
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Đang tải danh sách tạm giữ"
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
          {params.hasFilters ? "Không có tạm giữ khớp bộ lọc." : "Hiện chưa có tạm giữ nào."}
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
        {data.totalCount} tạm giữ · Trang {data.pageIndex}/{data.totalPages}
      </p>
      <ul className="space-y-2">
        {data.items.map((hold) => (
          <li key={hold.id}>
            <button
              type="button"
              onClick={() => params.select(hold.id)}
              className="flex min-h-11 w-full flex-col gap-2 rounded-xl border border-heritage-border bg-heritage-surface p-4 text-left hover:border-heritage-primary"
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{HOLD_TYPE_LABELS[hold.type]}</span>
                <StatusBadge status={hold.status} />
                {hold.reviewOverdue && hold.status === "ACTIVE" && <ReviewOverdueBadge />}
              </span>
              <span className="break-words text-sm text-heritage-muted">{hold.reason}</span>
              <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-heritage-muted tabular-nums">
                <span>Phạm vi: {holdScopeLabel(hold.scope)}</span>
                <span>Rà soát: {formatDateTime(hold.reviewAt)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <AdminPagination
        label="Phân trang tạm giữ"
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

function HoldDetailView({ holdId, onBack }: { holdId: string; onBack: () => void }) {
  const query = useAdminHold(holdId);
  const back = (
    <Button variant="outline" className="min-h-11" onClick={onBack}>
      <ArrowLeft className="size-4" aria-hidden="true" />
      Về danh sách
    </Button>
  );
  if (query.isPending)
    return (
      <div role="status" aria-busy="true" aria-label="Đang tải tạm giữ" className="mt-6 space-y-3">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  if (query.isError) {
    const specific = adminActionError(query.error);
    return (
      <div className="mt-6 space-y-3">
        {back}
        {specific ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {specific}
          </p>
        ) : (
          <AdminErrorMessage
            error={query.error}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        )}
      </div>
    );
  }
  return <HoldDetailBody hold={query.data} back={back} refreshing={query.isFetching} />;
}

type HoldDialog = "review" | "release";

function HoldDetailBody({
  hold,
  back,
  refreshing,
}: {
  hold: Hold;
  back: ReactNode;
  refreshing: boolean;
}) {
  const client = useQueryClient();
  const [dialog, setDialog] = useState<HoldDialog | null>(null);
  const active = hold.status === "ACTIVE";
  const ownerAlive = hold.type === "OWNER_ALIVE";
  const close = () => setDialog(null);
  const dialogKey = `${hold.id}:${hold.etag}`;
  return (
    <div className="mt-6 space-y-6" aria-busy={refreshing}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        <Button
          variant="outline"
          className="min-h-11"
          disabled={refreshing}
          onClick={() => void client.invalidateQueries({ queryKey: adminKeys.hold(hold.id) })}
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          Tải lại
        </Button>
      </div>
      <section
        aria-labelledby="hold-title"
        className="space-y-3 rounded-xl border border-heritage-border bg-heritage-surface p-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="hold-title" className="text-lg font-semibold">
            {HOLD_TYPE_LABELS[hold.type]}
          </h2>
          <StatusBadge status={hold.status} />
          {hold.reviewOverdue && active && <ReviewOverdueBadge />}
        </div>
        <p className="break-words text-sm">{hold.reason}</p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Fact label="Phạm vi" value={holdScopeLabel(hold.scope)} />
          <Fact label="Lần rà soát tiếp theo" value={formatDateTime(hold.reviewAt)} />
          <Fact label="Đặt lúc" value={formatDateTime(hold.createdAt)} />
          <Fact label="Mã kho" value={hold.vaultId} mono />
          {hold.targetId && <Fact label="Mã gói" value={hold.targetId} mono />}
          {hold.releasedAt && <Fact label="Gỡ lúc" value={formatDateTime(hold.releasedAt)} />}
          {hold.releaseReason && <Fact label="Lý do gỡ" value={hold.releaseReason} />}
        </dl>
      </section>

      {active && ownerAlive && (
        <p
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          Tạm giữ này do chủ kho báo còn sống. Chỉ người xét duyệt kết luận mới gỡ được; quản trị
          viên không có thao tác gỡ.
        </p>
      )}
      {active ? (
        <section aria-label="Thao tác" className="flex flex-wrap gap-3">
          <Button className="min-h-11" variant="outline" onClick={() => setDialog("review")}>
            Hẹn rà soát
          </Button>
          {!ownerAlive && (
            <Button className="min-h-11" onClick={() => setDialog("release")}>
              Gỡ tạm giữ
            </Button>
          )}
        </section>
      ) : (
        <p role="status" className="text-sm text-heritage-muted">
          Tạm giữ đã được gỡ nên không còn thao tác.
        </p>
      )}

      {dialog === "review" && <ReviewHoldDialog key={dialogKey} hold={hold} onClose={close} />}
      {dialog === "release" && <ReleaseHoldDialog key={dialogKey} hold={hold} onClose={close} />}
    </div>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-heritage-muted">{label}</dt>
      <dd className={`break-words ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
