import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Shield,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  DASHBOARD_GROUPS,
  formatDateTime,
  INCIDENT_TYPE_LABELS,
  INCIDENT_STATUS_LABELS,
} from "../model/admin.content";
import { useAdminDashboard, useAdminIncidents } from "../model/useAdmin";
import { AdminErrorMessage } from "./AdminStateMessage";
import { ROUTES } from "@/shared/config/routes.config";

/** Tổng quan quản trị: KPI Tiles tương tác 1 chạm + Hàng đợi việc cần làm (Priority Incident Queue). */
export function AdminOverview() {
  const navigate = useNavigate();
  const query = useAdminDashboard();
  const urgentIncidents = useAdminIncidents({ status: "OPEN", pageIndex: 1, pageSize: 5 });

  if (query.isPending)
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Đang tải số liệu quản trị"
        className="mt-6 space-y-6"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
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

  const goToIncidents = (filters?: { overdue?: boolean; status?: string; type?: string }) => {
    const params = new URLSearchParams();
    params.set("view", "incidents");
    if (filters?.status) params.set("status", filters.status);
    if (filters?.overdue) params.set("overdue", "true");
    if (filters?.type) params.set("type", filters.type);
    navigate(`${ROUTES.ADMIN.ROOT}?${params.toString()}`);
  };

  const goToHolds = () => {
    navigate(`${ROUTES.ADMIN.ROOT}?view=holds`);
  };

  return (
    <div className="mt-6 space-y-8" aria-busy={query.isFetching}>
      {/* Top Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-heritage-muted">
          Cập nhật lúc <time dateTime={data.serverTime}>{formatDateTime(data.serverTime)}</time>{" "}
          (giờ máy chủ)
        </p>
        <Button
          variant="outline"
          size="sm"
          className="min-h-10 text-xs font-semibold"
          onClick={() => {
            void query.refetch();
            void urgentIncidents.refetch();
          }}
          disabled={query.isFetching}
        >
          <RefreshCw
            className={`size-3.5 ${query.isFetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Tải lại số liệu
        </Button>
      </div>

      {/* 4 ACTIONABLE KPI TILES (One-Click Quick Filters) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tile 1: Quá hạn xử lý */}
        <button
          type="button"
          onClick={() => goToIncidents({ overdue: true })}
          className={`group flex flex-col justify-between rounded-2xl border p-5 text-left transition-all hover:shadow-md ${
            data.overdueIncidents > 0
              ? "border-red-300 bg-red-50/70 hover:border-red-400"
              : "border-heritage-border bg-heritage-surface hover:border-heritage-gold"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-heritage-muted">Sự cố quá hạn SLA</span>
            <div
              className={`flex size-8 items-center justify-center rounded-xl ${
                data.overdueIncidents > 0
                  ? "bg-red-200 text-red-900"
                  : "bg-heritage-primary/10 text-heritage-primary"
              }`}
            >
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <b
              className={`text-3xl font-bold tabular-nums ${
                data.overdueIncidents > 0 ? "text-red-700" : "text-heritage-primary"
              }`}
            >
              {data.overdueIncidents}
            </b>
            <span className="flex items-center gap-1 text-xs font-semibold text-heritage-muted group-hover:text-heritage-primary">
              Xem sự cố <ArrowRight className="size-3.5" />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-heritage-muted">Sự cố vi phạm SLA giải quyết</p>
        </button>

        {/* Tile 2: Sự cố đang mở */}
        <button
          type="button"
          onClick={() => goToIncidents({ status: "OPEN" })}
          className="group flex flex-col justify-between rounded-2xl border border-heritage-border bg-heritage-surface p-5 text-left transition-all hover:border-heritage-gold hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-heritage-muted">Sự cố đang mở</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <b className="text-3xl font-bold tabular-nums text-heritage-primary">
              {data.openIncidents}
            </b>
            <span className="flex items-center gap-1 text-xs font-semibold text-heritage-muted group-hover:text-heritage-primary">
              Hàng đợi <ArrowRight className="size-3.5" />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-heritage-muted">Cần phân công hoặc đang xử lý</p>
        </button>

        {/* Tile 3: Kho đang tạm giữ */}
        <button
          type="button"
          onClick={goToHolds}
          className="group flex flex-col justify-between rounded-2xl border border-heritage-border bg-heritage-surface p-5 text-left transition-all hover:border-heritage-gold hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-heritage-muted">Kho đang tạm giữ</span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
              <ShieldAlert className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <b className="text-3xl font-bold tabular-nums text-heritage-primary">
              {data.activeHolds}
            </b>
            <span className="flex items-center gap-1 text-xs font-semibold text-heritage-muted group-hover:text-heritage-primary">
              Chi tiết <ArrowRight className="size-3.5" />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-heritage-muted">
            {data.holdsPastReview > 0
              ? `${data.holdsPastReview} kho quá hạn rà soát`
              : "Bảo vệ kho chờ phán quyết"}
          </p>
        </button>

        {/* Tile 4: Chưa có người xét duyệt */}
        <button
          type="button"
          onClick={() => goToIncidents({ type: "NO_VERIFIER" })}
          className={`group flex flex-col justify-between rounded-2xl border p-5 text-left transition-all hover:shadow-md ${
            data.casesWithoutVerifier > 0
              ? "border-amber-300 bg-amber-50/70 hover:border-amber-400"
              : "border-heritage-border bg-heritage-surface hover:border-heritage-gold"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-heritage-muted">Chờ người xét duyệt</span>
            <div
              className={`flex size-8 items-center justify-center rounded-xl ${
                data.casesWithoutVerifier > 0
                  ? "bg-amber-200 text-amber-900"
                  : "bg-heritage-primary/10 text-heritage-primary"
              }`}
            >
              <UserCheck className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <b
              className={`text-3xl font-bold tabular-nums ${
                data.casesWithoutVerifier > 0 ? "text-amber-800" : "text-heritage-primary"
              }`}
            >
              {data.casesWithoutVerifier}
            </b>
            <span className="flex items-center gap-1 text-xs font-semibold text-heritage-muted group-hover:text-heritage-primary">
              Phân công <ArrowRight className="size-3.5" />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-heritage-muted">Hồ sơ chứng tử cần chỉ định</p>
        </button>
      </div>

      {/* PRIORITY INCIDENT QUEUE ("Việc cần làm ngay") */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-heritage-primary">Việc cần làm ưu tiên</h2>
            <p className="text-xs text-heritage-muted">
              Các sự cố vận hành đang mở có mức độ ưu tiên cao nhất cần giải quyết
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToIncidents({ status: "OPEN" })}
            className="text-xs font-semibold text-heritage-gold hover:text-amber-800"
          >
            Xem tất cả sự cố <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </div>

        {urgentIncidents.isPending && <Skeleton className="h-44 w-full rounded-2xl" />}

        {urgentIncidents.isSuccess && urgentIncidents.data.items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-heritage-border bg-heritage-surface p-8 text-center">
            <Shield className="mx-auto size-8 text-green-600" />
            <p className="mt-2 text-sm font-semibold text-heritage-text">
              Không có sự cố nào đang chờ xử lý
            </p>
            <p className="text-xs text-heritage-muted">
              Toàn bộ hệ thống đang vận hành ổn định trong ngưỡng an toàn.
            </p>
          </div>
        )}

        {urgentIncidents.isSuccess && urgentIncidents.data.items.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-heritage-border bg-heritage-surface shadow-sm">
            <div className="divide-y divide-heritage-border/60">
              {urgentIncidents.data.items.map((incident) => {
                const isOverdue = incident.overdue;
                return (
                  <div
                    key={incident.id}
                    className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-heritage-primary/5 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-heritage-primary">
                          #{incident.id.slice(0, 8)}
                        </span>
                        <span className="rounded-full bg-heritage-primary/10 px-2 py-0.5 text-xs font-semibold text-heritage-primary">
                          {INCIDENT_TYPE_LABELS[incident.type]}
                        </span>
                        {isOverdue && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">
                            Quá hạn
                          </span>
                        )}
                        <span className="rounded-full border border-heritage-border px-2 py-0.5 text-[11px] text-heritage-muted">
                          {INCIDENT_STATUS_LABELS[incident.status]}
                        </span>
                      </div>
                      <p className="line-clamp-1 text-xs text-heritage-text">{incident.summary}</p>
                      <p className="text-[11px] text-heritage-muted">
                        Hạn xử lý: <time>{formatDateTime(incident.dueAt)}</time>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 sm:shrink-0">
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`${ROUTES.ADMIN.ROOT}?view=incidents&incidentId=${incident.id}`)
                        }
                        className="bg-[#E0C486] text-xs font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
                      >
                        Xử lý sự cố
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* DASHBOARD COUNTERS BY GROUP */}
      <div className="space-y-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-heritage-muted">
          Thống kê hạ tầng & Nhân sự vận hành
        </h2>
        {DASHBOARD_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`admin-group-${group.id}`} className="space-y-3">
            <h3
              id={`admin-group-${group.id}`}
              className="text-xs font-semibold text-heritage-muted"
            >
              {group.title}
            </h3>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.counters.map((counter) => {
                const value = data[counter.key];
                const needsAttention = counter.attention && value > 0;
                return (
                  <div
                    key={counter.key}
                    className={`rounded-2xl border p-4 shadow-sm ${
                      needsAttention
                        ? "border-amber-300 bg-amber-50"
                        : "border-heritage-border bg-heritage-surface"
                    }`}
                  >
                    <dt className="text-xs font-medium text-heritage-muted">{counter.label}</dt>
                    <dd className="mt-2 flex flex-wrap items-baseline gap-2">
                      <span className="text-2xl font-bold tabular-nums text-heritage-text">
                        {value}
                      </span>
                      {needsAttention && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900">
                          <AlertTriangle className="size-3" aria-hidden="true" />
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
      </div>

      <p className="text-xs text-heritage-muted">
        Zero-Knowledge: Quản trị viên chỉ quản lý hạ tầng và giám sát vận hành, tuyệt đối không giải
        mã và không đọc nội dung kho của người dùng.
      </p>
    </div>
  );
}
