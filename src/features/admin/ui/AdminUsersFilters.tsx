import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  ADMIN_USER_ROLES,
  ADMIN_USER_STATUSES,
  adminUserStatusSchema,
} from "../model/admin.schema";
import { ROLE_LABELS, STATUS_LABELS } from "../model/admin.content";
import type { AdminUsersFilters as Filters } from "../model/useAdminUsersSearchParams";

const SEARCH_DEBOUNCE_MS = 400;

interface AdminUsersFiltersProps {
  filters: Filters;
  hasFilters: boolean;
  onChange: (patch: Partial<Filters>, replace?: boolean) => void;
  onClear: () => void;
}

/** Bộ lọc tài khoản: tìm kiếm debounce, chip vai trò, select trạng thái. */
export function AdminUsersFilters({
  filters,
  hasFilters,
  onChange,
  onClear,
}: AdminUsersFiltersProps) {
  const [draft, setDraft] = useState(filters.search);
  const [syncedSearch, setSyncedSearch] = useState(filters.search);
  const timer = useRef<number | undefined>(undefined);

  // URL đổi từ ngoài (Xoá bộ lọc, Back) → đồng bộ lại ô nhập.
  if (filters.search !== syncedSearch) {
    setSyncedSearch(filters.search);
    setDraft(filters.search);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const commitSearch = (value: string) => {
    window.clearTimeout(timer.current);
    if (value.trim() !== filters.search) onChange({ search: value }, true);
  };

  return (
    <div className="space-y-4 rounded-xl border border-heritage-border bg-heritage-surface p-4">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          commitSearch(draft);
        }}
      >
        <label htmlFor="admin-users-search" className="text-sm font-medium">
          Tìm theo tên hoặc email
        </label>
        <div className="relative mt-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-heritage-muted"
            aria-hidden="true"
          />
          <input
            id="admin-users-search"
            type="search"
            value={draft}
            maxLength={200}
            autoComplete="off"
            onChange={(event) => {
              const value = event.target.value;
              setDraft(value);
              window.clearTimeout(timer.current);
              timer.current = window.setTimeout(() => commitSearch(value), SEARCH_DEBOUNCE_MS);
            }}
            className="min-h-11 w-full rounded-lg border border-heritage-border bg-white pl-9 pr-3 text-sm outline-none focus-visible:border-heritage-gold focus-visible:ring-2 focus-visible:ring-heritage-gold/30"
          />
        </div>
      </form>

      <div className="flex flex-wrap items-end gap-4">
        <fieldset className="min-w-0">
          <legend className="text-sm font-medium">Vai trò</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            <RoleChip
              label="Tất cả"
              pressed={!filters.role}
              onClick={() => onChange({ role: undefined })}
            />
            {ADMIN_USER_ROLES.map((role) => (
              <RoleChip
                key={role}
                label={ROLE_LABELS[role]}
                pressed={filters.role === role}
                onClick={() => onChange({ role })}
              />
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="admin-users-status" className="text-sm font-medium">
            Trạng thái
          </label>
          <select
            id="admin-users-status"
            value={filters.status ?? ""}
            onChange={(event) => {
              const parsed = adminUserStatusSchema.safeParse(event.target.value);
              onChange({ status: parsed.success ? parsed.data : undefined });
            }}
            className="mt-1 block min-h-11 rounded-lg border border-heritage-border bg-white px-3 text-sm focus-visible:border-heritage-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-heritage-gold/30"
          >
            <option value="">Tất cả</option>
            {ADMIN_USER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <Button variant="outline" className="min-h-11" onClick={onClear}>
            Xoá bộ lọc
          </Button>
        )}
      </div>
    </div>
  );
}

function RoleChip({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-heritage-gold ${
        pressed
          ? "border-heritage-primary bg-heritage-primary text-white"
          : "border-heritage-border bg-white text-heritage-text hover:bg-heritage-primary/5"
      }`}
    >
      {label}
    </button>
  );
}
