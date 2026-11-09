import { Lock } from "lucide-react";
import { HOLD_STATUS_LABELS, HOLD_TYPE_LABELS, formatDateTime } from "../model/admin.content";
import { useAdminHolds } from "../model/useAdmin";

/**
 * Hộp "Tạm giữ kho" trong chi tiết sự cố: cho Admin thấy kho đang bị chặn gì mà không phải sang trang Tạm giữ.
 * Chỉ hiện khi kho có hold; hold đang hiệu lực được ưu tiên, không thì hiện hold gần nhất đã gỡ.
 */
export function IncidentHoldBox({ vaultId }: { vaultId: string }) {
  const query = useAdminHolds({ vaultId, pageIndex: 1, pageSize: 5 });
  const items = query.data?.items ?? [];
  const hold = items.find((item) => item.status === "ACTIVE") ?? items[0];
  if (!hold) return null;
  const active = hold.status === "ACTIVE";
  return (
    <section
      aria-labelledby="incident-hold"
      className="space-y-3 rounded-xl border border-heritage-border bg-heritage-surface p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="incident-hold" className="flex items-center gap-2 text-base font-semibold">
          <Lock className="size-4" aria-hidden="true" />
          Tạm giữ kho
        </h3>
        <span
          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            active
              ? "border-purple-200 bg-purple-50 text-purple-900"
              : "border-stone-300 bg-stone-100 text-stone-700"
          }`}
        >
          {HOLD_STATUS_LABELS[hold.status]}
        </span>
        {active && hold.reviewOverdue && (
          <span className="text-xs font-semibold text-red-700">Quá hạn rà soát</span>
        )}
      </div>
      <p className="text-sm">
        {active
          ? `Đang chặn: ${HOLD_TYPE_LABELS[hold.type] ?? hold.type}.`
          : (hold.releaseReason ?? "Đã gỡ.")}
      </p>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-heritage-muted">Đặt lúc</dt>
          <dd>{formatDateTime(hold.createdAt)}</dd>
        </div>
        {active ? (
          <div>
            <dt className="text-heritage-muted">Lần rà soát tiếp theo</dt>
            <dd>{formatDateTime(hold.reviewAt)}</dd>
          </div>
        ) : (
          hold.releasedAt && (
            <div>
              <dt className="text-heritage-muted">Gỡ lúc</dt>
              <dd>{formatDateTime(hold.releasedAt)}</dd>
            </div>
          )
        )}
      </dl>
    </section>
  );
}
