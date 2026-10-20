import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button";

interface ReadState {
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => unknown;
}

/** Lỗi riêng từng khối; không thay lỗi API bằng số 0 hay dữ liệu minh họa. */
export function OverviewQueryState({ query, children }: { query: ReadState; children: ReactNode }) {
  if (query.isPending)
    return (
      <p role="status" className="overview-muted">
        Đang tải…
      </p>
    );
  if (query.isError)
    return (
      <div role="alert" className="space-y-2">
        <p>Không tải được dữ liệu.</p>
        <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  return children;
}
