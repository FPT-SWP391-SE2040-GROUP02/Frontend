import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { AlertCircle, Inbox, RefreshCcw } from "lucide-react";
import { Button, Skeleton } from "@/shared/ui";
import { accessTokenMemory } from "@/shared/api/accessToken";
import type { AuthState } from "@/entities/user/model/authSlice";
import {
  isOwnerVaultMissing,
  useOwnerPackages,
  useOwnerVault,
} from "@/features/vault-management/model/useOwnerVault";
import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { useVaultAuditLogs } from "@/features/audit-logs/model/useVaultAuditLogs";
import {
  AUDIT_LOG_PAGE_SIZE,
  buildAuditLogSearch,
  parseAuditLogFilter,
} from "@/features/audit-logs/model/auditLogUrl";
import {
  auditLogDateError,
  localDateToNextDayStartIso,
  localDateToStartOfDayIso,
} from "@/features/audit-logs/model/auditLogDate";
import { AuditLogFilters } from "@/features/audit-logs/ui/AuditLogFilters";
import { AuditLogTable } from "@/features/audit-logs/ui/AuditLogTable";
import type { AuditLogFilterState } from "@/features/audit-logs/model/auditLog.types";
import type { AuditNameMap } from "@/features/audit-logs/model/auditLogLabels";

/**
 * Tra tên cho nhật ký từ trang đầu (tối đa 100) của tài sản, người nhận, gói bàn giao.
 * Gói bàn giao lấy cả gói bàn giao đã xóa vì nhật ký còn dòng "Xóa gói bàn giao"; tài sản/người nhận đã xóa vẫn hiện mã rút gọn.
 */
const NAME_LOOKUP = { pageIndex: 1, pageSize: 100 };

/**
 * @description Widget Owner duy nhất cho nhật ký hoạt động của kho.
 * URL là nguồn chính cho filter + page; đổi filter reset page về 1.
 * AuthBootstrap xóa cache nên đổi account không publish dữ liệu cũ.
 */
export function OwnerAuditLog() {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const ready = authenticated && Boolean(accessTokenMemory.get());
  const vault = useOwnerVault(ready);
  const vaultId = vault.data?.id ?? "";
  const [searchParams, setSearchParams] = useSearchParams();

  const state = parseAuditLogFilter(searchParams, { pageIndex: 1, pageSize: AUDIT_LOG_PAGE_SIZE });
  const filterError = auditLogDateError(searchParams.get("from"), searchParams.get("to"));
  const logs = useVaultAuditLogs(
    vaultId,
    {
      pageIndex: state.pageIndex,
      pageSize: state.pageSize,
      sortBy: "at",
      isAscending: false,
      action: state.action,
      from: localDateToStartOfDayIso(state.fromDate),
      to: localDateToNextDayStartIso(state.toDate),
    },
    ready && Boolean(vault.data) && !filterError,
  );

  const lookupEnabled = ready && Boolean(vault.data);
  const assetNames = useVaultAssets(vaultId, NAME_LOOKUP);
  const beneficiaryNames = useBeneficiaries(vaultId, NAME_LOOKUP);
  const groupNames = useOwnerPackages(vaultId, lookupEnabled, NAME_LOOKUP, true);
  const names: AuditNameMap = {};
  if (vault.data) {
    let vaultName = "Kho của tôi";
    if (vault.data.name) {
      vaultName = vault.data.name;
    }
    names[vault.data.id] = vaultName;
  }
  if (assetNames.data) {
    for (const item of assetNames.data.items) {
      names[item.id] = item.name;
    }
  }
  if (beneficiaryNames.data) {
    for (const item of beneficiaryNames.data.items) {
      names[item.id] = item.fullName;
    }
  }
  if (groupNames.data) {
    for (const item of groupNames.data.items) {
      names[item.id] = item.name;
    }
  }

  function commit(next: Partial<AuditLogFilterState>) {
    setSearchParams(buildAuditLogSearch(searchParams, { ...state, ...next }));
  }

  function applyFilter(next: Omit<AuditLogFilterState, "pageIndex" | "pageSize">) {
    commit({ ...next, pageIndex: 1 });
  }

  function resetFilter() {
    commit({
      action: undefined,
      fromDate: undefined,
      toDate: undefined,
      pageIndex: 1,
    });
  }

  function setPage(page: number) {
    if (page >= 1) commit({ pageIndex: page });
  }

  if (!authenticated) {
    return (
      <p role="status" className="text-sm text-heritage-muted">
        Vui lòng đăng nhập để xem nhật ký.
      </p>
    );
  }
  if (vault.isError && isOwnerVaultMissing(vault.error)) {
    return (
      <div
        role="status"
        className="rounded-xl border border-heritage-border bg-heritage-surface p-6 text-sm"
      >
        Kho của bạn chưa sẵn sàng. Tạo kho trước khi xem nhật ký.
      </div>
    );
  }
  if (vault.isError) {
    return (
      <div
        role="alert"
        className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"
      >
        <p>Không tải được thông tin kho.</p>
        <Button
          variant="outline"
          onClick={() => void vault.refetch()}
          disabled={vault.isFetching}
          className="min-h-11"
        >
          <RefreshCcw className="size-4" aria-hidden="true" />
          Thử lại
        </Button>
      </div>
    );
  }
  if (vault.isPending) {
    return (
      <div role="status" className="space-y-3" aria-label="Đang tải thông tin kho">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // Phục hồi khi URL vẫn trỏ vào trang ngoài phạm vi: trang vượt cả khi totalPages=0 hoặc
  // totalPages>0 nhưng pageIndex > totalPages. Backend trả items=[] với pageIndex giữ nguyên
  // nên ta phải phát hiện từ URL chứ không dựa vào items.length.
  const isOutOfRange =
    logs.data !== undefined && state.pageIndex > Math.max(1, logs.data.totalPages);

  return (
    <section
      aria-labelledby="owner-audit-log"
      className="space-y-5 rounded-xl border border-heritage-border bg-heritage-surface p-6"
    >
      <header className="space-y-1">
        <h2 id="owner-audit-log" className="text-base font-semibold">
          Nhật ký hoạt động của kho
        </h2>
        <p className="text-xs text-heritage-muted">
          Mỗi dòng ghi lại một thao tác đã lưu thành công lên kho của bạn. Dùng bộ lọc để thu hẹp
          theo loại thao tác hoặc khoảng ngày.
        </p>
      </header>
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
          <p>Không tải được nhật ký. Kiểm tra bộ lọc hoặc thử lại.</p>
          <Button
            variant="outline"
            onClick={() => void logs.refetch()}
            disabled={logs.isFetching}
            className="min-h-11"
          >
            <RefreshCcw className="size-4" aria-hidden="true" />
            Thử lại
          </Button>
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
            Hãy thử bỏ bộ lọc hoặc chờ thao tác tiếp theo trên kho.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-heritage-muted" aria-live="polite">
            {logs.data.totalCount} dòng · trang {logs.data.pageIndex}/
            {Math.max(1, logs.data.totalPages)}
          </p>
          <AuditLogTable items={logs.data.items} names={names} />
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
