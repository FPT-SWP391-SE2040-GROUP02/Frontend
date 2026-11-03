import type { ReactNode } from "react";
import { cn } from "cn";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export interface DataTableColumn<Row> {
  id: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  className?: string;
  /** Cột chỉ có nút (ví dụ "Thao tác"): tiêu đề chỉ cho trình đọc màn hình. */
  srOnlyHeader?: boolean;
}

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /** Tên bảng cho trình đọc màn hình. */
  caption: string;
  loading?: boolean;
  /** Tên đọc được cho từng dòng (ví dụ "Mục đang ẩn"); không truyền thì dòng không có tên riêng. */
  rowLabel?: (row: Row) => string | undefined;
  /** Hiện thay cho các dòng khi chưa có dữ liệu (thường là `EmptyState`). */
  empty?: ReactNode;
  /** Chiều rộng tối thiểu trước khi bảng cuộn ngang trên điện thoại. */
  minWidthClass?: string;
  className?: string;
}

/** Bảng dùng chung: tiêu đề cột, dòng đang tải, dòng trống và cuộn ngang ở màn hẹp. */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  caption,
  loading = false,
  rowLabel,
  empty,
  minWidthClass = "min-w-[640px]",
  className,
}: DataTableProps<Row>) {
  const colSpan = columns.length;
  return (
    <Table className={cn(minWidthClass, "text-left", className)}>
      <caption className="sr-only">{caption}</caption>
      <TableHeader>
        <TableRow className="border-heritage-border hover:bg-transparent">
          {columns.map((column) => (
            <TableHead
              key={column.id}
              scope="col"
              className="h-auto px-4 py-3 text-xs font-semibold text-heritage-muted first:pl-0 last:pr-0"
            >
              {column.srOnlyHeader ? (
                <span className="sr-only">{column.header}</span>
              ) : (
                column.header
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={colSpan} className="py-6 text-sm text-heritage-muted">
              <span role="status">Đang tải…</span>
            </TableCell>
          </TableRow>
        )}
        {!loading && rows.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={colSpan} className="whitespace-normal py-6">
              {empty ?? <p className="text-sm text-heritage-muted">Chưa có dữ liệu.</p>}
            </TableCell>
          </TableRow>
        )}
        {!loading &&
          rows.map((row) => (
            <TableRow
              key={rowKey(row)}
              aria-label={rowLabel?.(row)}
              className="border-heritage-border hover:bg-transparent"
            >
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  className={cn(
                    "whitespace-normal px-4 py-3 align-middle first:pl-0 last:pr-0",
                    column.className,
                  )}
                >
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
