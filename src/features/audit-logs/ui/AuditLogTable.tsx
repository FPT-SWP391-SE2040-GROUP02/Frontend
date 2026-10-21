import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui";
import type { AuditLogEntry } from "../model/auditLog.schema";
import {
  ACTION_LABELS,
  ACTOR_ROLE_LABELS,
  OUTCOME_LABELS,
  TARGET_TYPE_LABELS,
  displayName,
  friendlyReason,
  shortId,
  type AuditNameMap,
} from "../model/auditLogLabels";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Điểm danh và đơn thanh toán không có API tra tên; mã rút gọn không giúp ích nên chỉ hiện trong tooltip. */
const HIDE_CODE_TYPES: readonly AuditLogEntry["targetType"][] = ["CHECK_IN", "PAYMENT_ORDER"];

const OUTCOME_STYLES: Record<AuditLogEntry["outcome"], string> = {
  SUCCEEDED: "bg-green-100 text-green-800",
  DENIED: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-800",
};

/**
 * @description Bảng chỉ-đọc hiển thị dòng nhật ký bằng tiếng Việt. Không tạo N+1 để tra tên từng dòng;
 * mã đối tượng chỉ hiện dạng rút gọn (đủ để phân biệt), UUID đầy đủ nằm trong tooltip.
 */
export function AuditLogTable({
  items,
  names = {},
}: {
  items: AuditLogEntry[];
  /** id → tên thật (tài sản, người nhận, gói bàn giao); thiếu thì hiện mã rút gọn. */
  names?: AuditNameMap;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Thời điểm</TableHead>
          <TableHead scope="col">Người thực hiện</TableHead>
          <TableHead scope="col">Thao tác</TableHead>
          <TableHead scope="col">Đối tượng</TableHead>
          <TableHead scope="col">Phiên bản</TableHead>
          <TableHead scope="col">Kết quả</TableHead>
          <TableHead scope="col">Ghi chú</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((entry) => {
          // Chủ kho tự thao tác trên kho của mình nên không cần hiện mã tài khoản; vai trò khác thì hiện để truy vết.
          const showActorId = entry.actorRole !== "OWNER" && entry.actorUserId !== null;
          return (
            <TableRow key={entry.id}>
              <TableCell>{dateTimeFormatter.format(new Date(entry.at))}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{ACTOR_ROLE_LABELS[entry.actorRole]}</span>
                  {showActorId && entry.actorUserId && (
                    <span className="text-xs text-heritage-muted" title={entry.actorUserId}>
                      {shortId(entry.actorUserId)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium" title={entry.action}>
                {ACTION_LABELS[entry.action]}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm" title={entry.targetId ?? undefined}>
                    {TARGET_TYPE_LABELS[entry.targetType]}
                  </span>
                  {entry.targetId && !HIDE_CODE_TYPES.includes(entry.targetType) && (
                    <span className="text-xs text-heritage-muted" title={entry.targetId}>
                      {displayName(entry.targetId, names)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{entry.targetVersion ?? "—"}</TableCell>
              <TableCell>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${OUTCOME_STYLES[entry.outcome]}`}
                >
                  {OUTCOME_LABELS[entry.outcome]}
                </span>
              </TableCell>
              <TableCell className="max-w-xs whitespace-normal break-words text-xs text-heritage-muted">
                {entry.reason ? friendlyReason(entry.reason, names) : "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
