import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui";
import { formatDateTime } from "@/shared/lib/dateFormat";
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
  SUCCEEDED: "bg-green-100 text-green-800",
  DENIED: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-800",
};

/**
 * @description Bảng chỉ-đọc nhật ký toàn hệ thống cho Admin: người thực hiện (tên, email, vai trò), thao tác,
 * đối tượng, kho, kết quả và lý do. Mã dài chỉ hiện rút gọn, UUID đầy đủ nằm trong tooltip.
 */
export function AdminAuditLogTable({ items }: { items: AdminAuditLogEntry[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Thời điểm</TableHead>
          <TableHead scope="col">Người thực hiện</TableHead>
          <TableHead scope="col">Thao tác</TableHead>
          <TableHead scope="col">Đối tượng</TableHead>
          <TableHead scope="col">Kho</TableHead>
          <TableHead scope="col">Kết quả</TableHead>
          <TableHead scope="col">Lý do</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{formatDateTime(entry.at)}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {entry.actorFullName ?? ACTOR_ROLE_LABELS[entry.actorRole]}
                </span>
                {entry.actorEmail && (
                  <span className="text-xs text-heritage-muted">{entry.actorEmail}</span>
                )}
                <span
                  className="text-xs text-heritage-muted"
                  title={entry.actorUserId ?? undefined}
                >
                  {ACTOR_ROLE_LABELS[entry.actorRole]}
                  {entry.actorUserId && !entry.actorEmail ? ` · ${shortId(entry.actorUserId)}` : ""}
                </span>
              </div>
            </TableCell>
            <TableCell className="font-medium" title={entry.action}>
              {ACTION_LABELS[entry.action]}
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm">{TARGET_TYPE_LABELS[entry.targetType]}</span>
                {entry.targetId && (
                  <span className="text-xs text-heritage-muted" title={entry.targetId}>
                    {shortId(entry.targetId)}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell title={entry.vaultId ?? undefined}>
              {entry.vaultId ? shortId(entry.vaultId) : "—"}
            </TableCell>
            <TableCell>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${OUTCOME_STYLES[entry.outcome]}`}
              >
                {OUTCOME_LABELS[entry.outcome]}
              </span>
            </TableCell>
            <TableCell className="max-w-xs whitespace-normal break-words text-xs text-heritage-muted">
              {entry.reason ? friendlyReason(entry.reason) : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
