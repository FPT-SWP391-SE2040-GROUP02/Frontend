import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { AlertCircle, Inbox, RefreshCcw } from "lucide-react";
import { Button, Skeleton } from "@/shared/ui";
import { accessTokenMemory } from "@/shared/api/accessToken";
import type { AuthState } from "@/entities/user/model/authSlice";
import { useAdminAuditLogs } from "../model/useVaultAuditLogs";
import {
  AUDIT_LOG_PAGE_SIZE,
  buildAuditLogSearch,
  parseAuditLogFilter,
} from "../model/auditLogUrl";
import {
  auditLogDateError,
  localDateToNextDayStartIso,
  localDateToStartOfDayIso,
} from "../model/auditLogDate";
import { classifyAuditLogError } from "../model/auditLogError";
import type { AuditLogFilterState } from "../model/auditLog.types";
import { AuditLogFilters } from "./AuditLogFilters";
import { AdminAuditLogTable } from "./AdminAuditLogTable";

/**
 * @description Màn Nhật ký kiểm toán của Admin: danh sách thật từ GET /admin/audit-logs, mới nhất trước.
 * URL là nguồn chính cho bộ lọc và trang; đổi bộ lọc đưa về trang 1. Không có dữ liệu mẫu: lỗi API hiện lỗi
 * kèm thử lại, danh sách rỗng hiện trạng thái rỗng.
 */
export function AdminAuditLogs() {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const ready = authenticated && Boolean(accessTokenMemory.get());
  const [searchParams, setSearchParams] = useSearchParams();

  const state = parseAuditLogFilter(searchParams, { pageIndex: 1, pageSize: AUDIT_LOG_PAGE_SIZE });
  const filterError = auditLogDateError(searchParams.get("from"), searchParams.get("to"));
  const logs = useAdminAuditLogs(
    {
      pageIndex: state.pageIndex,
      pageSize: state.pageSize,
      sortBy: "at",
      isAscending: false,
      action: state.action,
      from: localDateToStartOfDayIso(state.fromDate),
      to: localDateToNextDayStartIso(state.toDate),
    },
    ready && !filterError,
  );

  function commit(next: Partial<AuditLogFilterState>) {
    setSearchParams(buildAuditLogSearch(searchParams, { ...state, ...next }));
  }

  function applyFilter(next: Omit<AuditLogFilterState, "pageIndex" | "pageSize">) {
    commit({ ...next, pageIndex: 1 });
  }

  function resetFilter() {
    commit({ action: undefined, fromDate: undefined, toDate: undefined, pageIndex: 1 });
  }

  function setPage(page: number) {
    if (page >= 1) commit({ pageIndex: page });
  }

  if (!authenticated) {
    return (
      <p role="status" className="mt-6 text-sm text-heritage-muted">
        Vui lòng đăng nhập để xem nhật ký.
      </p>
    );
  }

  // URL có thể trỏ vào trang ngoài phạm vi; Backend vẫn trả items rỗng nên phải so với totalPages.
  const isOutOfRange =
    logs.data !== undefined && state.pageIndex > Math.max(1, logs.data.totalPages);
  const failure = classifyAuditLogError(logs.error);

  return (
    <section aria-labelledby="admin-audit-log" className="mt-6 space-y-5">
      <h2 id="admin-audit-log" className="sr-only">
        Danh sách nhật ký kiểm toán
      </h2>
      <AuditLogFilters
        state={state}
        pending={logs.isFetching}
        error={filterError}
        onApply={applyFilter}
        onReset={resetFilter}
      />
      {filterError ? null : logs.isError ? (
        <div
          role="alert"
          className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"
        >
          <p>{failure.message}</p>
          {failure.canRetry && (
            <Button
              variant="outline"
              onClick={() => void logs.refetch()}
              disabled={logs.isFetching}
              className="min-h-11"
            >
              <RefreshCcw className="size-4" aria-hidden="true" />
              Thử lại
            </Button>
          )}
        </div>
      ) : logs.isPending ? (
        <div role="status" className="space-y-2" aria-label="Đang tải nhật ký">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isOutOfRange ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <AlertCircle className="size-4" aria-hidden="true" />
          <p>Trang hiện vượt quá phạm vi. Quay lại trang 1 để tiếp tục.</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage(1)}
            disabled={logs.isFetching}
            className="min-h-11"
          >
            Về trang 1
          </Button>
        </div>
      ) : logs.data.items.length === 0 ? (
        <div
          role="status"
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-heritage-border bg-heritage-canvas px-6 py-10 text-center"
        >
          <Inbox className="size-8 text-heritage-gold" aria-hidden="true" />
          <p className="text-sm font-medium">Chưa có dòng nhật ký nào khớp bộ lọc.</p>
          <p className="text-xs text-heritage-muted">
            Hãy thử bỏ bộ lọc hoặc chờ thao tác tiếp theo.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-heritage-muted" aria-live="polite">
            {logs.data.totalCount} dòng · trang {logs.data.pageIndex}/
            {Math.max(1, logs.data.totalPages)}
          </p>
          <AdminAuditLogTable items={logs.data.items} />
          <nav
            aria-label="Phân trang nhật ký"
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <Button
              variant="outline"
              onClick={() => setPage(state.pageIndex - 1)}
              disabled={!logs.data.hasPreviousPage || logs.isFetching}
              className="min-h-11"
            >
              Trang trước
            </Button>
            <span className="text-sm">Trang {state.pageIndex}</span>
            <Button
              variant="outline"
              onClick={() => setPage(state.pageIndex + 1)}
              disabled={!logs.data.hasNextPage || logs.isFetching}
              className="min-h-11"
            >
              Trang sau
            </Button>
          </nav>
        </div>
      )}
    </section>
  );
}
