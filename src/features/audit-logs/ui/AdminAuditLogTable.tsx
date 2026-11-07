import { formatDateTime } from "@/shared/lib/dateFormat";
import { ListTable, ListTableRow } from "@/shared/ui/listKit";
import type { AdminAuditLogEntry } from "../model/auditLog.schema";
import {
  ACTION_LABELS,
  ACTOR_ROLE_LABELS,
  OUTCOME_LABELS,
  TARGET_TYPE_LABELS,
  friendlyReason,
  shortId,
} from "../model/auditLogLabels";

const OUTCOME_STYLES: Record<AdminAuditLogEntry["outcome"], string> = {
  SUCCEEDED: "bg-emerald-50 text-emerald-800",
  DENIED: "bg-amber-50 text-amber-900",
  FAILED: "bg-red-50 text-red-800",
};

/**
 * @description Danh sách chỉ-đọc nhật ký toàn hệ thống cho Admin, 4 cột: thời điểm, người thực hiện,
 * hành động kèm đối tượng, kết quả kèm lý do. Mã dài chỉ hiện rút gọn, UUID đầy đủ nằm trong tooltip.
 */
export function AdminAuditLogTable({ items }: { items: AdminAuditLogEntry[] }) {
  return (
    <ListTable
      columns="130px minmax(160px,.9fr) minmax(220px,1.4fr) minmax(180px,1fr)"
      headings={["Thời điểm", "Người thực hiện", "Hành động", "Kết quả · lý do"]}
    >
      {items.map((entry) => {
        const [date, time] = splitDateTime(formatDateTime(entry.at));
        return (
          <ListTableRow key={entry.id}>
            <div className="flex flex-col">
              <b className="font-semibold tabular-nums">{date}</b>
              <small className="tabular-nums text-heritage-muted">{time}</small>
            </div>
            <div className="flex flex-col">
              <b className="font-medium">
                {entry.actorFullName ?? ACTOR_ROLE_LABELS[entry.actorRole]}
              </b>
              {entry.actorEmail && (
                <small className="break-all text-heritage-muted">{entry.actorEmail}</small>
              )}
              <small className="text-heritage-muted" title={entry.actorUserId ?? undefined}>
                {ACTOR_ROLE_LABELS[entry.actorRole]}
                {entry.actorUserId && !entry.actorEmail ? ` · ${shortId(entry.actorUserId)}` : ""}
              </small>
            </div>
            <div className="flex flex-col" title={entry.action}>
              <b className="font-medium">{ACTION_LABELS[entry.action]}</b>
              <small className="text-heritage-muted" title={entry.targetId ?? undefined}>
                {TARGET_TYPE_LABELS[entry.targetType]}
                {entry.targetId ? ` · ${shortId(entry.targetId)}` : ""}
                {entry.vaultId ? ` · Kho ${shortId(entry.vaultId)}` : ""}
              </small>
            </div>
            <div className="flex flex-col items-start gap-1">
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${OUTCOME_STYLES[entry.outcome]}`}
              >
                {OUTCOME_LABELS[entry.outcome]}
              </span>
              {entry.reason && (
                <small className="break-words text-heritage-muted">
                  {friendlyReason(entry.reason)}
                </small>
              )}
            </div>
          </ListTableRow>
        );
      })}
    </ListTable>
  );
}

/** Tách "dd/MM/yyyy HH:mm" thành ngày và giờ để xếp hai dòng. */
function splitDateTime(value: string): [string, string] {
  const index = value.lastIndexOf(" ");
  return index < 0 ? [value, ""] : [value.slice(0, index), value.slice(index + 1)];
}
