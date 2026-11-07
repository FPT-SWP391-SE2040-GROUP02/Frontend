import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import type { AdminUser, AdminUserStatus, AdminUsersPage } from "../model/admin.schema";
import { ROLE_LABELS, STATUS_LABELS, formatDate, formatDateTime } from "../model/admin.content";
import { adminKeys, useAdminUsers } from "../model/useAdmin";
import { AdminCreateUserDialog } from "./AdminCreateUserDialog";
import { useAdminUsersSearchParams } from "../model/useAdminUsersSearchParams";
import { AdminUserActions } from "./AdminUserActions";
import { AdminErrorMessage } from "./AdminStateMessage";
import { AdminUsersFilters } from "./AdminUsersFilters";
import { AdminUserDetail } from "./AdminUserDetail";
import { ListTable, ListTableRow } from "@/shared/ui/listKit";

const STATUS_STYLES: Record<AdminUserStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  LOCKED: "bg-amber-50 text-amber-900 border-amber-300",
  DISABLED: "bg-stone-100 text-stone-700 border-stone-300",
};

/** Danh sách tài khoản: GET /admin/users, bộ lọc trên URL; đổi vai trò và khóa/mở tài khoản qua hộp thoại có lý do. */
export function AdminUsers({ actionLabel }: { actionLabel?: (action: string) => string }) {
  const [urlParams, setUrlParams] = useSearchParams();
  const selectedUserId = urlParams.get("user");
  const openUser = (userId: string | null) =>
    setUrlParams((current) => {
      const next = new URLSearchParams(current);
      if (userId) next.set("user", userId);
      else next.delete("user");
      return next;
    });
  const search = useAdminUsersSearchParams();
  const query = useAdminUsers(search.query);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousPage = useRef(search.page);
  const client = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [createdFeedback, setCreatedFeedback] = useState<string | null>(null);

  const handleCreated = (user: AdminUser) => {
    void client.invalidateQueries({ queryKey: [...adminKeys.all, "users"] });
    setCreatedFeedback(`Đã tạo tài khoản ${user.email} (${ROLE_LABELS[user.role]}) thành công.`);
  };

  // Đổi trang: đưa focus về đầu kết quả để người dùng bàn phím không mất vị trí.
  useEffect(() => {
    if (previousPage.current !== search.page) headingRef.current?.focus();
    previousPage.current = search.page;
  }, [search.page]);

  if (selectedUserId)
    return (
      <AdminUserDetail
        userId={selectedUserId}
        onBack={() => openUser(null)}
        actionLabel={actionLabel}
      />
    );

  return (
    <div className="mt-6 space-y-4">
      <AdminUsersFilters
        filters={search.filters}
        hasFilters={search.hasFilters}
        onChange={search.setFilters}
        onClear={search.clearFilters}
      />
      <section aria-labelledby="admin-users-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="admin-users-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-lg font-semibold outline-none"
          >
            Danh sách tài khoản
          </h2>
          <Button
            type="button"
            onClick={() => {
              setCreatedFeedback(null);
              setCreateOpen(true);
            }}
          >
            + Tạo tài khoản
          </Button>
        </div>
        {createdFeedback && (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {createdFeedback}
          </div>
        )}
        <UsersResult
          page={search.page}
          hasFilters={search.hasFilters}
          query={query}
          onPage={search.setPage}
          onClear={search.clearFilters}
          onOpen={openUser}
        />
      </section>
      {createOpen && (
        <AdminCreateUserDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onDone={handleCreated}
        />
      )}
    </div>
  );
}

interface UsersResultProps {
  page: number;
  hasFilters: boolean;
  query: ReturnType<typeof useAdminUsers>;
  onPage: (page: number) => void;
  onClear: () => void;
  onOpen: (userId: string) => void;
}

function UsersResult({ page, hasFilters, query, onPage, onClear, onOpen }: UsersResultProps) {
  if (query.isPending)
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Đang tải danh sách tài khoản"
        className="space-y-2"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-14 rounded-lg" />
        ))}
      </div>
    );

  // Lỗi thật luôn thắng dữ liệu trang trước (placeholder) để không hiện danh sách cũ như kết quả mới.
  if (query.isError)
    return (
      <AdminErrorMessage
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
        onResetFilters={onClear}
      />
    );

  const data = query.data;
  const refreshing = query.isPlaceholderData;

  if (data.totalPages > 0 && page > data.totalPages)
    return (
      <div role="status" className="space-y-3 rounded-xl border border-heritage-border p-4">
        <p className="text-sm">Trang {page} không tồn tại.</p>
        <Button variant="outline" className="min-h-11" onClick={() => onPage(data.totalPages)}>
          Về trang cuối
        </Button>
      </div>
    );

  if (data.items.length === 0)
    return (
      <div role="status" className="space-y-3 rounded-xl border border-heritage-border p-4">
        <p className="text-sm text-heritage-muted">
          {hasFilters ? "Không có tài khoản khớp bộ lọc." : "Chưa có tài khoản nào."}
        </p>
        {hasFilters && (
          <Button variant="outline" className="min-h-11" onClick={onClear}>
            Xoá bộ lọc
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
        {data.totalCount} tài khoản · Trang {data.pageIndex}/{data.totalPages}
      </p>
      <UsersTable data={data} onOpen={onOpen} />
      {data.totalPages > 1 && (
        <nav
          aria-label="Phân trang tài khoản"
          className="mt-4 flex items-center justify-between gap-4"
        >
          <Button
            variant="outline"
            className="min-h-11"
            disabled={!data.hasPreviousPage || refreshing}
            onClick={() => onPage(data.pageIndex - 1)}
          >
            Trang trước
          </Button>
          <span className="text-sm">
            Trang {data.pageIndex} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            className="min-h-11"
            disabled={!data.hasNextPage || refreshing}
            onClick={() => onPage(data.pageIndex + 1)}
          >
            Trang sau
          </Button>
        </nav>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: AdminUserStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const initial = (user: AdminUser) => (user.fullName.trim() || user.email).charAt(0).toUpperCase();

function userTone(status: AdminUserStatus): "none" | "warn" | "bad" {
  if (status === "ACTIVE") return "none";
  return status === "LOCKED" ? "warn" : "bad";
}

/** Danh sách tài khoản theo prototype: ảnh chữ cái, vai trò, trạng thái kèm xác minh email, hoạt động, thao tác. */
function UsersTable({ data, onOpen }: { data: AdminUsersPage; onOpen: (userId: string) => void }) {
  return (
    <ListTable
      columns="minmax(200px,1.4fr) 120px minmax(130px,.8fr) minmax(150px,1fr) minmax(170px,auto)"
      headings={["Người dùng", "Vai trò", "Trạng thái", "Hoạt động", "Thao tác"]}
    >
      {data.items.map((user) => (
        <ListTableRow key={user.id} tone={userTone(user.status)}>
          <div role="cell" className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dfe9e3] text-[12.5px] font-semibold text-heritage-primary"
            >
              {initial(user)}
            </span>
            <div className="min-w-0">
              <b className="block break-words text-sm text-heritage-primary">
                {user.fullName || "Chưa có tên"}
              </b>
              <small className="block break-all text-[12.5px] text-heritage-muted">
                {user.email}
              </small>
            </div>
          </div>
          <div role="cell">
            <span className="inline-flex h-6 items-center rounded-xl bg-[#e5ede8] px-2.5 text-xs font-semibold text-heritage-primary">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
          <div role="cell" className="flex flex-col items-start gap-1.5">
            <StatusBadge status={user.status} />
            <small className="text-[12.5px] text-heritage-muted">
              {user.emailVerified ? "Email đã xác minh" : "Email chưa xác minh"}
            </small>
          </div>
          <div role="cell" className="min-w-0">
            <b className="block text-sm font-medium tabular-nums">
              Tham gia {formatDate(user.createdAt)}
            </b>
            <small className="block text-[12.5px] text-heritage-muted tabular-nums">
              {user.lastLoginAt
                ? `Đăng nhập ${formatDateTime(user.lastLoginAt)}`
                : "Chưa đăng nhập"}
            </small>
          </div>
          <div role="cell" className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="min-h-10"
              aria-label={`Xem ${user.fullName || user.email}`}
              onClick={() => onOpen(user.id)}
            >
              Xem
            </Button>
            <AdminUserActions user={user} />
          </div>
        </ListTableRow>
      ))}
    </ListTable>
  );
}
