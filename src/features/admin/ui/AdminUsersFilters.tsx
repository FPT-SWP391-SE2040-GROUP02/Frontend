import { useState } from "react";
import {
  ListFilterBar,
  ListSearchField,
  ListSegmentTabs,
  ListSelectField,
} from "@/shared/ui/listKit";
import {
  ADMIN_USER_ROLES,
  ADMIN_USER_STATUSES,
  adminUserRoleSchema,
  adminUserStatusSchema,
} from "../model/admin.schema";
import { ROLE_LABELS, STATUS_LABELS } from "../model/admin.content";
import type { AdminUsersFilters as Filters } from "../model/useAdminUsersSearchParams";

interface AdminUsersFiltersProps {
  filters: Filters;
  hasFilters: boolean;
  onChange: (patch: Partial<Filters>, replace?: boolean) => void;
  onClear: () => void;
}

/** Bộ lọc tài khoản: thẻ vai trò, ô tìm theo tên hoặc email (debounce), chọn trạng thái. */
export function AdminUsersFilters({
  filters,
  hasFilters,
  onChange,
  onClear,
}: AdminUsersFiltersProps) {
  // Đổi key để ô tìm kiếm bỏ chữ đang gõ dở và hủy lần ghi trễ khi xóa bộ lọc.
  const [resetCount, setResetCount] = useState(0);
  return (
    <div className="space-y-4">
      <ListSegmentTabs
        label="Vai trò"
        value={filters.role ?? ""}
        options={[
          { value: "", label: "Tất cả" },
          ...ADMIN_USER_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
        ]}
        onChange={(value) => {
          const parsed = adminUserRoleSchema.safeParse(value);
          onChange({ role: parsed.success ? parsed.data : undefined });
        }}
      />
      <ListFilterBar
        onClear={
          hasFilters
            ? () => {
                setResetCount((count) => count + 1);
                onClear();
              }
            : undefined
        }
        clearLabel="Xoá bộ lọc"
      >
        <ListSearchField
          key={resetCount}
          label="Tìm theo tên hoặc email"
          placeholder="Tìm theo tên hoặc email"
          value={filters.search}
          maxLength={200}
          onCommit={(value) => onChange({ search: value }, true)}
        />
        <ListSelectField
          label="Trạng thái"
          value={filters.status ?? ""}
          allLabel="Mọi trạng thái"
          options={ADMIN_USER_STATUSES.map((status) => ({
            value: status,
            label: STATUS_LABELS[status],
          }))}
          onChange={(value) => {
            const parsed = adminUserStatusSchema.safeParse(value);
            onChange({ status: parsed.success ? parsed.data : undefined });
          }}
        />
      </ListFilterBar>
    </div>
  );
}
