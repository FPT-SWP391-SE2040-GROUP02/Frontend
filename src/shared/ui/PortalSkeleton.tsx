import { cn } from "cn";

/**
 * Khung chờ của cổng người nhận: các khối xám có vệt sáng quét qua, đúng chỗ và cỡ nội dung sẽ hiện. `label` là câu cho
 * trình đọc màn hình (và vẫn là chữ trong trang), khối xám chỉ để nhìn.
 */
export function PortalSkeleton({
  label,
  rows = 3,
  className,
}: {
  label: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div role="status" className={cn("space-y-3", className)}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="pm-fade flex items-center gap-4 rounded-2xl border border-heritage-border bg-heritage-surface px-5 py-[18px]"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <span className="pm-skel size-12 shrink-0 rounded-full" />
            <span className="min-w-0 flex-1 space-y-2.5">
              <span className="pm-skel block h-4 w-2/5 rounded-md" />
              <span className="pm-skel block h-3 w-3/4 rounded-md" />
              <span className="pm-skel block h-1.5 w-1/3 rounded-full" />
            </span>
            <span className="pm-skel hidden h-11 w-32 rounded-xl sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
