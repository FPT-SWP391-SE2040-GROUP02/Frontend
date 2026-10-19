import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui";
import type { AuditLogEntry } from "../model/auditLog.schema";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

/**
 * @description Bảng chỉ-đọc hiển thị dòng nhật ký. Không tạo N+1 để tra tên từng dòng;
 * FE đối chiếu id bằng module tài sản/người nhận nếu cần.
 */
export function AuditLogTable({ items }: { items: AuditLogEntry[] }) {
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
          <TableHead scope="col">Lý do</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{dateTimeFormatter.format(new Date(entry.at))}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{entry.actorRole}</span>
                <span className="text-xs text-heritage-muted">{entry.actorUserId ?? "—"}</span>
              </div>
            </TableCell>
            <TableCell className="font-mono text-xs">{entry.action}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm">{entry.targetType}</span>
                <span className="text-xs text-heritage-muted">{entry.targetId ?? "—"}</span>
              </div>
            </TableCell>
            <TableCell>{entry.targetVersion ?? "—"}</TableCell>
            <TableCell>{entry.outcome}</TableCell>
            <TableCell className="max-w-xs whitespace-normal break-words text-xs text-heritage-muted">
              {entry.reason ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
