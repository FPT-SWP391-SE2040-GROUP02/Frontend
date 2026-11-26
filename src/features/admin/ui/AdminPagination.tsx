import { NumberedPagination } from "@/shared/ui/NumberedPagination";

interface AdminPaginationProps {
  label: string;
  pageIndex: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  busy: boolean;
  onPage: (page: number) => void;
}

/** Phân trang dùng chung cho các danh sách Admin; chỉ hiện khi có nhiều hơn một trang. */
export function AdminPagination({
  label,
  pageIndex,
  totalPages,
  busy,
  onPage,
}: AdminPaginationProps) {
  return (
    <div className="mt-4 flex justify-center">
      <NumberedPagination
        label={label}
        pageIndex={pageIndex}
        totalPages={totalPages}
        busy={busy}
        onPage={onPage}
      />
    </div>
  );
}
