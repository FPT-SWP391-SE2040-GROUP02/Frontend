import { useState } from "react";
import { ArrowLeft, IdCard } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  AUDIT_OUTCOME_LABELS,
  CASE_STATUS_LABELS,
  DECISION_KIND_LABELS,
  ROLE_LABELS,
  STATUS_LABELS,
  formatDate,
  formatDateTime,
} from "../model/admin.content";
import { useAdminUser } from "../model/useAdmin";
import { AdminNotaryCardDialog } from "./AdminNotaryCardDialog";
import { AdminUserActions } from "./AdminUserActions";
import { AdminErrorMessage } from "./AdminStateMessage";

interface AdminUserDetailProps {
  userId: string;
  onBack: () => void;
  /** Nhãn tiếng Việt của hành động nhật ký; truyền từ trang Admin để không import chéo feature. */
  actionLabel?: (action: string) => string;
}

/** Chi tiết một tài khoản: thông tin, hồ sơ đang giữ, quyết định và hoạt động gần đây; đổi vai trò, khóa, mở ngay tại đây. */
export function AdminUserDetail({ userId, onBack, actionLabel }: AdminUserDetailProps) {
  const query = useAdminUser(userId);
  const [cardOpen, setCardOpen] = useState(false);
  const label = actionLabel ?? ((action: string) => action);
  const back = (
    <Button variant="outline" className="min-h-11" onClick={onBack}>
      <ArrowLeft className="size-4" aria-hidden="true" />
      Về danh sách
    </Button>
  );
  if (query.isPending)
    return (
      <div
        className="mt-6 space-y-4"
        role="status"
        aria-busy="true"
        aria-label="Đang tải tài khoản"
      >
        {back}
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  if (query.isError)
    return (
      <div className="mt-6 space-y-4">
        {back}
        <AdminErrorMessage
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      </div>
    );
  const user = query.data;
  const isVerifier = user.role === "VERIFIER";
  return (
    <div className="mt-6 space-y-6">
      {back}
      <section className="space-y-4 rounded-2xl border border-heritage-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <span
              aria-hidden="true"
              className="grid size-[52px] shrink-0 place-items-center rounded-full bg-[#dfe9e3] text-[17px] font-semibold text-heritage-primary"
            >
              {(user.fullName.trim() || user.email).charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2 className="break-words text-[26px] font-bold leading-tight text-heritage-primary">
                {user.fullName || "Chưa có tên"}
              </h2>
              <p className="break-all text-sm text-heritage-muted">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isVerifier && (
              <Button
                variant="outline"
                className="min-h-11"
                aria-label={`Xem thẻ công chứng của ${user.fullName || user.email}`}
                onClick={() => setCardOpen(true)}
              >
                <IdCard className="size-4" aria-hidden="true" />
                Xem thẻ công chứng
              </Button>
            )}
            <AdminUserActions user={user} />
          </div>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Vai trò" value={ROLE_LABELS[user.role]} />
          <Fact label="Trạng thái" value={STATUS_LABELS[user.status]} />
          <Fact label="Email" value={user.emailVerified ? "Đã xác minh" : "Chưa xác minh"} />
          <Fact label="Tham gia" value={formatDate(user.createdAt)} />
          <Fact
            label="Đăng nhập gần nhất"
            value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Chưa đăng nhập"}
          />
        </dl>
      </section>

      {isVerifier && (
        <AdminNotaryCardDialog
          userId={user.id}
          name={user.fullName || user.email}
          open={cardOpen}
          onClose={() => setCardOpen(false)}
        />
      )}

      {isVerifier && (
        <section aria-labelledby="user-cases" className="space-y-3">
          <h3 id="user-cases" className="text-base font-semibold">
            Hồ sơ đang giao
          </h3>
          {user.assignedCases.length === 0 ? (
            <p className="text-sm text-heritage-muted">Hiện không giữ hồ sơ nào.</p>
          ) : (
            <ul className="divide-y divide-heritage-border rounded-2xl border border-heritage-border bg-heritage-surface">
              {user.assignedCases.map((item) => (
                <li
                  key={item.caseId}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
                >
                  <span className="font-mono">#{item.caseId.slice(0, 8)}</span>
                  <span>{CASE_STATUS_LABELS[item.status] ?? item.status}</span>
                  <span className={item.overdue ? "font-semibold text-red-700" : ""}>
                    Hạn xét: {formatDateTime(item.dueAt)}
                    {item.overdue && " · quá hạn"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {isVerifier && (
        <section aria-labelledby="user-decisions" className="space-y-3">
          <h3 id="user-decisions" className="text-base font-semibold">
            Quyết định gần đây
          </h3>
          {user.recentDecisions.length === 0 ? (
            <p className="text-sm text-heritage-muted">Chưa có quyết định nào.</p>
          ) : (
            <ul className="divide-y divide-heritage-border rounded-2xl border border-heritage-border bg-heritage-surface">
              {user.recentDecisions.map((item, index) => (
                <li
                  key={`${item.caseId}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
                >
                  <span className="font-mono">#{item.caseId.slice(0, 8)}</span>
                  <span>{DECISION_KIND_LABELS[item.kind] ?? item.kind}</span>
                  <time dateTime={item.decidedAt} className="tabular-nums text-heritage-muted">
                    {formatDateTime(item.decidedAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="user-activity" className="space-y-3">
        <h3 id="user-activity" className="text-base font-semibold">
          Hoạt động gần đây
        </h3>
        {user.recentActivity.length === 0 ? (
          <p className="text-sm text-heritage-muted">Chưa có hoạt động nào.</p>
        ) : (
          <ol className="divide-y divide-heritage-border rounded-2xl border border-heritage-border bg-heritage-surface">
            {user.recentActivity.map((item, index) => (
              <li
                key={`${item.at}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
              >
                <span>{label(item.action)}</span>
                <span className={item.outcome === "SUCCEEDED" ? "" : "font-semibold text-red-700"}>
                  {AUDIT_OUTCOME_LABELS[item.outcome] ?? item.outcome}
                </span>
                <time dateTime={item.at} className="tabular-nums text-heritage-muted">
                  {formatDateTime(item.at)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-heritage-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
