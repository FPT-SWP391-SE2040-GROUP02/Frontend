import { Button } from "@/shared/ui/button";

interface AdminPaginationProps {
  label: string;
  pageIndex: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  busy: boolean;
  onPage: (page: number) => void;
}

/** Phân trang dùng chung cho danh sách sự cố và tạm giữ; chỉ hiện khi có nhiều hơn một trang. */
export function AdminPagination({
  label,
  pageIndex,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  busy,
  onPage,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={label} className="mt-4 flex items-center justify-between gap-4">
      <Button
        variant="outline"
        className="min-h-11"
        disabled={!hasPreviousPage || busy}
        onClick={() => onPage(pageIndex - 1)}
      >
        Trang trước
      </Button>
      <span className="text-sm">
        Trang {pageIndex} / {totalPages}
      </span>
      <Button
        variant="outline"
        className="min-h-11"
        disabled={!hasNextPage || busy}
        onClick={() => onPage(pageIndex + 1)}
      >
        Trang sau
      </Button>
    </nav>
  );
}
