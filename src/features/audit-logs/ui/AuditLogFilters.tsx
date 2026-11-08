import { ListDateField, ListFilterBar, ListSelectField } from "@/shared/ui/listKit";
import { auditActionValues } from "../model/auditLog.schema";
import { ACTION_LABELS } from "../model/auditLogLabels";
import type { AuditLogFilterState } from "../model/auditLog.types";

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
          options={auditActionValues.map((action) => ({
            value: action,
            label: ACTION_LABELS[action],
          }))}
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
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
