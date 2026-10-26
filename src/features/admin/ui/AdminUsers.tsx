import { useEffect, useRef, useState } from "react";
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

const STATUS_STYLES: Record<AdminUserStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  LOCKED: "bg-amber-50 text-amber-900 border-amber-300",
  DISABLED: "bg-stone-100 text-stone-700 border-stone-300",
};

/** Danh sách tài khoản: GET /admin/users, bộ lọc trên URL; đổi vai trò và khóa/mở tài khoản qua hộp thoại có lý do. */
export function AdminUsers() {
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
          <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {createdFeedback}
          </div>
        )}
        <UsersResult
          page={search.page}
          hasFilters={search.hasFilters}
          query={query}
          onPage={search.setPage}
          onClear={search.clearFilters}
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
}

function UsersResult({ page, hasFilters, query, onPage, onClear }: UsersResultProps) {
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
      <UsersTable data={data} />
      <UsersCards data={data} />
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

const lastLogin = (user: AdminUser) =>
  user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Chưa đăng nhập";

const initial = (user: AdminUser) => (user.fullName.trim() || user.email).charAt(0).toUpperCase();

function UsersTable({ data }: { data: AdminUsersPage }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-heritage-border bg-heritage-surface md:block">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Danh sách tài khoản, trang {data.pageIndex}</caption>
        <thead className="border-b border-heritage-border text-xs uppercase text-heritage-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">
              Người dùng
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Vai trò
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Trạng thái
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Email
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Tham gia
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Đăng nhập gần nhất
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-heritage-border">
          {data.items.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-heritage-primary/10 font-semibold text-heritage-primary"
                  >
                    {initial(user)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">{user.fullName || "Chưa có tên"}</p>
                    <p className="break-all text-xs text-heritage-muted">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">{ROLE_LABELS[user.role]}</td>
              <td className="px-4 py-3">
                <StatusBadge status={user.status} />
              </td>
              <td className="px-4 py-3">{user.emailVerified ? "Đã xác minh" : "Chưa xác minh"}</td>
              <td className="px-4 py-3 tabular-nums">{formatDate(user.createdAt)}</td>
              <td className="px-4 py-3 tabular-nums">{lastLogin(user)}</td>
              <td className="px-4 py-3">
                <AdminUserActions user={user} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersCards({ data }: { data: AdminUsersPage }) {
  return (
    <ul className="space-y-3 md:hidden" aria-label="Danh sách tài khoản">
      {data.items.map((user) => (
        <li
          key={user.id}
          className="space-y-2 rounded-xl border border-heritage-border bg-heritage-surface p-4"
        >
          <div>
            <p className="font-medium">{user.fullName || "Chưa có tên"}</p>
            <p className="break-all text-xs text-heritage-muted">{user.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-heritage-border px-2.5 py-0.5 font-semibold">
              {ROLE_LABELS[user.role]}
            </span>
            <StatusBadge status={user.status} />
            <span className="text-heritage-muted">
              {user.emailVerified ? "Email đã xác minh" : "Email chưa xác minh"}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-heritage-muted">Tham gia</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-heritage-muted">Đăng nhập gần nhất</dt>
              <dd>{lastLogin(user)}</dd>
            </div>
          </dl>
          <AdminUserActions user={user} />
        </li>
      ))}
    </ul>
  );
}
