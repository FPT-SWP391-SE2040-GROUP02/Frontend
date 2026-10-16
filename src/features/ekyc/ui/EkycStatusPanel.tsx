import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { Button } from "@/shared/ui";
import { ekycService } from "../api/ekycService";
import { EkycUploads } from "./EkycUploads";
const labels = {
  NOT_STARTED: "Bạn chưa xác minh danh tính.",
  PENDING: "Đang chờ bước so khớp khuôn mặt.",
  PASSED: "Danh tính đã được xác minh.",
  FAILED: "Lần xác minh chưa đạt yêu cầu.",
};
/** Màn thật lấy trạng thái từ server; URL ?step=result không thể tạo kết quả thành công. */
export function EkycStatusPanel() {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const status = useQuery({
    queryKey: ["ekyc", "me"],
    queryFn: ({ signal }) => ekycService.getStatus(signal),
    enabled: authenticated,
    retry: false,
  });
  return (
    <section
      aria-label="Trạng thái xác minh danh tính"
      className="space-y-4 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
    >
      <h1 className="text-2xl font-semibold">Xác minh danh tính</h1>
      {!authenticated ? (
        <p role="status">Vui lòng đăng nhập để xem trạng thái xác minh.</p>
      ) : status.isPending ? (
        <p role="status">Đang tải trạng thái xác minh…</p>
      ) : status.isError ? (
        <div role="alert">
          <p>Không tải được trạng thái xác minh.</p>
          <Button
            className="mt-3 min-h-11"
            disabled={status.isFetching}
            onClick={() => void status.refetch()}
          >
            Thử lại
          </Button>
        </div>
      ) : (
        <p role="status">{labels[status.data.status]}</p>
      )}
      {authenticated && status.isSuccess && <EkycUploads />}
    </section>
  );
}
