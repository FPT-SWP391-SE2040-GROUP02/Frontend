import { type ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Skeleton } from "./skeleton";
import { Button } from "./button";
import { EmptyState } from "./EmptyState";
import { APP_MESSAGES } from "@/shared/constants";

/**
 * @description Thuộc tính cấu hình cho component AsyncState.
 */
export interface AsyncStateProps {
  /** Cờ trạng thái đang tải dữ liệu */
  isLoading: boolean;
  /** Lỗi xảy ra trong quá trình truy vấn (hoặc null/undefined nếu không có lỗi) */
  error?: Error | unknown | null;
  /** Cờ xác định dữ liệu có bị rỗng hay không (ví dụ: items.length === 0) */
  isEmpty?: boolean;
  /** Callback thử lại truy vấn khi gặp lỗi */
  onRetry?: () => void;
  /** Giao diện Skeleton tùy chỉnh khi đang tải (mặc định hiển thị skeleton 3 dòng) */
  loadingFallback?: ReactNode;
  /** Giao diện EmptyState tùy chỉnh */
  emptyFallback?: ReactNode;
  /** Thông điệp lỗi tùy chỉnh */
  errorMessage?: string;
  /** Giao diện hiển thị khi dữ liệu đã tải thành công */
  children: ReactNode;
}

/**
 * @description Component bao bọc tự động xử lý đủ 4 trạng thái tải dữ liệu theo chuẩn Mục 5 AGENTS.md:
 * 1. isLoading: Hiển thị Skeleton thanh lịch.
 * 2. isError: Hiển thị giao diện thông báo lỗi kèm nút "Thử lại".
 * 3. isEmpty: Hiển thị giao diện dữ liệu rỗng (EmptyState).
 * 4. isSuccess: Render `children` dữ liệu thực tế.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useProducts();
 *
 * return (
 *   <AsyncState
 *     isLoading={isLoading}
 *     error={error}
 *     isEmpty={!data || data.items.length === 0}
 *     onRetry={() => refetch()}
 *   >
 *     <ProductList items={data?.items} />
 *   </AsyncState>
 * );
 * ```
 */
export function AsyncState({
  isLoading,
  error,
  isEmpty = false,
  onRetry,
  loadingFallback,
  emptyFallback,
  errorMessage,
  children,
}: AsyncStateProps) {
  // 1. Trạng thái Đang tải (isLoading)
  if (isLoading) {
    if (loadingFallback) return <>{loadingFallback}</>;
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-1/3 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  // 2. Trạng thái Gặp lỗi (isError)
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center animate-in fade-in-50">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h4 className="text-base font-semibold text-destructive">
          {APP_MESSAGES.ERROR.LOAD_FAILED}
        </h4>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {errorMessage || (error instanceof Error ? error.message : APP_MESSAGES.ERROR.DEFAULT)}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <RotateCcw className="h-4 w-4" />
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  // 3. Trạng thái Dữ liệu rỗng (isEmpty)
  if (isEmpty) {
    if (emptyFallback) return <>{emptyFallback}</>;
    return <EmptyState />;
  }

  // 4. Trạng thái Thành công (isSuccess)
  return <>{children}</>;
}
