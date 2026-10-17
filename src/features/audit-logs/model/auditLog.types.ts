import type { AuditAction, AuditLogEntry, AuditLogQuery } from "./auditLog.schema";

export type { AuditAction, AuditLogEntry, AuditLogQuery };

/** Trạng thái filter đang hiển thị; mọi giá trị đều raw wire từ URL. */
export interface AuditLogFilterState {
  /** Trang hiện tại, bắt đầu từ 1. */
  pageIndex: number;
  /** Số dòng mỗi trang; backend giới hạn 1..100. */
  pageSize: number;
  /** Lọc theo action; trống = mọi loại. */
  action?: AuditAction;
  /** Ngày bắt đầu khoảng, dạng YYYY-MM-DD theo local time. */
  fromDate?: string;
  /** Ngày kết thúc khoảng, dạng YYYY-MM-DD theo local time. UI nói "đến hết ngày" (inclusive)
   *  nhưng request gửi `[from, to+1 ngày)` để giữ `[from, to)` exclusive trên Backend. */
  toDate?: string;
}
