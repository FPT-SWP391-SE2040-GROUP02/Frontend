import { Button } from "@/shared/ui/button";
import { ERROR_MESSAGES } from "../model/admin.content";
import { classifyAdminError } from "../model/adminError";

interface AdminErrorMessageProps {
  error: unknown;
  onRetry: () => void;
  retrying: boolean;
  /** Hiện khi BE từ chối bộ lọc (400). */
  onResetFilters?: () => void;
}

/** Khung lỗi dùng chung của slice; 404/403 không có nút thử lại vì là quyết định quyền. */
export function AdminErrorMessage({
  error,
  onRetry,
  retrying,
  onResetFilters,
}: AdminErrorMessageProps) {
  const kind = classifyAdminError(error);
  const canRetry = kind === "other" || kind === "invalidData";
  return (
    <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-800">{ERROR_MESSAGES[kind]}</p>
      {canRetry && (
        <Button className="min-h-11" onClick={onRetry} disabled={retrying}>
          Thử lại
        </Button>
      )}
      {kind === "badRequest" && onResetFilters && (
        <Button className="min-h-11" variant="outline" onClick={onResetFilters}>
          Đặt lại bộ lọc
        </Button>
      )}
    </div>
  );
}
