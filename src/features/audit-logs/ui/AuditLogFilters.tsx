import { ListDateField, ListFilterBar, ListSelectField } from "@/shared/ui/listKit";
import { auditActionValues } from "../model/auditLog.schema";
import { ACTION_LABELS } from "../model/auditLogLabels";
import type { AuditLogFilterState } from "../model/auditLog.types";

/** Hành động đã gỡ hoặc đổi tên: còn trong dữ liệu cũ nên vẫn hiện ở bảng, nhưng không đưa vào bộ lọc. */
const REMOVED_ACTIONS: ReadonlySet<string> = new Set([
  "INCIDENT_ASSIGNED",
  "INCIDENT_RESOLVED",
  // Gói tài sản đã bỏ: chỉ còn trong nhật ký cũ.
  "CONTAINER_CREATED",
  "CONTAINER_UPDATED",
  "CONTAINER_ARCHIVED",
  "CONTAINER_REMOVED",
  "CONTAINER_ASSET_ADDED",
  "CONTAINER_ASSET_REMOVED",
  "CONTAINER_BENEFICIARY_ADDED",
  "CONTAINER_BENEFICIARY_REMOVED",
  // Tạm giữ kho đã bỏ: chỉ còn trong nhật ký cũ.
  "HOLD_PLACED",
  "HOLD_RELEASED",
]);

/** Mỗi nhãn một lần, bỏ hành động của tính năng đã gỡ. */
const ACTION_OPTIONS = (() => {
  const seen = new Set<string>();
  const options: { value: (typeof auditActionValues)[number]; label: string }[] = [];
  for (const action of auditActionValues) {
    const label = ACTION_LABELS[action];
    if (REMOVED_ACTIONS.has(action) || seen.has(label)) continue;
    seen.add(label);
    options.push({ value: action, label });
  }
  return options;
})();

/**
 * @description Bộ lọc URL-driven. Mỗi thay đổi action/from/to cập nhật URL ngay (URL là nguồn chính)
 * và `onApply` đặt lại page=1. Bỏ nút Áp dụng riêng để khỏi gửi lặp.
 */
export function AuditLogFilters({
  state,
  pending,
  error,
  onApply,
  onReset,
}: {
  state: AuditLogFilterState;
  pending: boolean;
  error?: string;
  onApply: (next: Omit<AuditLogFilterState, "pageIndex" | "pageSize">) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-2">
      <ListFilterBar onClear={pending ? undefined : onReset} clearLabel="Đặt lại">
        <ListSelectField
          label="Loại thao tác"
          value={state.action ?? ""}
          allLabel="Mọi hành động"
          options={ACTION_OPTIONS}
          onChange={(raw) =>
            onApply({
              action: raw === "" ? undefined : (raw as (typeof auditActionValues)[number]),
              fromDate: state.fromDate,
              toDate: state.toDate,
            })
          }
        />
        <ListDateField
          label="Từ"
          ariaLabel="Từ ngày"
          invalid={Boolean(error)}
          value={state.fromDate ?? ""}
          onChange={(value) =>
            onApply({ action: state.action, fromDate: value || undefined, toDate: state.toDate })
          }
        />
        <ListDateField
          label="Đến"
          ariaLabel="Đến hết ngày"
          invalid={Boolean(error)}
          value={state.toDate ?? ""}
          onChange={(value) =>
            onApply({ action: state.action, fromDate: state.fromDate, toDate: value || undefined })
          }
        />
      </ListFilterBar>
      {error && (
        <p role="alert" className="text-sm text-heritage-danger">
          {error}
        </p>
      )}
    </div>
  );
}
