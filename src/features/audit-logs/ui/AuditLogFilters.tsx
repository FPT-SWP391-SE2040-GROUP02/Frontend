import { useId } from "react";
import { Button, Input } from "@/shared/ui";
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
  const actionId = useId();
  const fromId = useId();
  const toId = useId();
  const errorId = useId();
  return (
    <div
      role="group"
      aria-label="Bộ lọc nhật ký"
      className="grid gap-3 rounded-xl border border-heritage-border bg-heritage-surface p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor={actionId} className="text-xs font-medium text-heritage-muted">
          Loại thao tác
        </label>
        <select
          id={actionId}
          aria-label="Loại thao tác"
          disabled={pending}
          value={state.action ?? ""}
          onChange={(event) => {
            const raw = event.target.value;
            const next = raw === "" ? undefined : (raw as (typeof auditActionValues)[number]);
            onApply({ action: next, fromDate: state.fromDate, toDate: state.toDate });
          }}
          className="min-h-11 rounded-lg border border-heritage-border bg-[var(--surface)] px-3 text-xs"
        >
          <option value="">Tất cả</option>
          {auditActionValues.map((action) => (
            <option key={action} value={action}>
              {ACTION_LABELS[action]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={fromId} className="text-xs font-medium text-heritage-muted">
          Từ ngày
        </label>
        <Input
          id={fromId}
          type="date"
          aria-label="Từ ngày"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="min-h-11"
          value={state.fromDate ?? ""}
          max={state.toDate || undefined}
          disabled={pending}
          onChange={(event) => {
            onApply({
              action: state.action,
              fromDate: event.target.value || undefined,
              toDate: state.toDate,
            });
          }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={toId} className="text-xs font-medium text-heritage-muted">
          Đến hết ngày
        </label>
        <Input
          id={toId}
          type="date"
          aria-label="Đến hết ngày"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="min-h-11"
          value={state.toDate ?? ""}
          min={state.fromDate || undefined}
          disabled={pending}
          onChange={(event) => {
            onApply({
              action: state.action,
              fromDate: state.fromDate,
              toDate: event.target.value || undefined,
            });
          }}
        />
      </div>
      <div className="flex items-end justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={pending}
          className="min-h-11"
        >
          Đặt lại
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-800 sm:col-span-2 lg:col-span-4">
          {error}
        </p>
      )}
    </div>
  );
}
