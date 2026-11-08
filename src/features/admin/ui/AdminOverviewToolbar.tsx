import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { formatDateTime } from "../model/admin.content";
import { adminKeys, useAdminDashboard } from "../model/useAdmin";

/** Giờ cập nhật số liệu và nút tải lại; đặt cùng hàng với tiêu đề trang Tổng quan. */
export function AdminOverviewToolbar() {
  const client = useQueryClient();
  const query = useAdminDashboard();
  return (
    <div className="flex flex-wrap items-center gap-3">
      {query.data && (
        <p className="text-xs text-heritage-muted">
          Cập nhật lúc{" "}
          <time dateTime={query.data.serverTime}>{formatDateTime(query.data.serverTime)}</time> (giờ
          máy chủ)
        </p>
      )}
      <Button
        variant="outline"
        size="sm"
        className="min-h-10 text-xs font-semibold"
        disabled={query.isFetching}
        onClick={() => void client.invalidateQueries({ queryKey: adminKeys.all })}
      >
        <RefreshCw
          className={`size-3.5 ${query.isFetching ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        Tải lại số liệu
      </Button>
    </div>
  );
}
