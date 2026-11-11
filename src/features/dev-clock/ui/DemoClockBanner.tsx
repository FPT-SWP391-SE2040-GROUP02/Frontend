import { useLayoutEffect, useRef } from "react";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { formatDate } from "@/shared/lib/dateFormat";
import { useDemoClockStatus } from "@/shared/clock/useServerNow";
import { useResetDemoClock } from "../model/useDemoClockActions";

/**
 * Dải báo ở đầu mọi trang (kể cả trang đăng nhập) khi hệ thống đang giả lập một ngày khác ngày thật.
 * Nút "Về ngày thật" chỉ hiện với Admin đang đăng nhập. Không giả lập, đang tải, 404 hoặc lỗi thì không hiện gì.
 */
export function DemoClockBanner() {
  const status = useDemoClockStatus();
  const role = useSelector((state: { auth: AuthState }) => state.auth.user?.role);
  const reset = useResetDemoClock();
  const bannerRef = useRef<HTMLDivElement>(null);
  const isShown = Boolean(status.data && status.data.isSimulated);

  // Báo chiều cao dải này qua biến CSS --demo-banner-height để cột menu đứng yên (WorkspaceShell) chừa chỗ, không bị che.
  useLayoutEffect(() => {
    const banner = bannerRef.current;
    if (!isShown || banner === null) {
      return;
    }
    const root = document.documentElement;
    const update = () => root.style.setProperty("--demo-banner-height", `${banner.offsetHeight}px`);
    update();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(update);
      observer.observe(banner);
    }
    return () => {
      if (observer !== null) {
        observer.disconnect();
      }
      root.style.removeProperty("--demo-banner-height");
    };
  }, [isShown]);

  if (!status.data || !status.data.isSimulated) {
    return null;
  }
  const isAdmin = role === "ADMIN";
  let resetLabel = "Về ngày thật";
  if (reset.isPending) {
    resetLabel = "Đang xử lý…";
  }
  return (
    <div
      ref={bannerRef}
      role="status"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-[#F1E6CC] px-4 py-2 text-sm font-semibold text-[#5A4210]"
    >
      <span>Đang giả lập ngày {formatDate(status.data.nowUtc)}</span>
      {isAdmin && (
        <button
          type="button"
          disabled={reset.isPending}
          onClick={() => reset.mutate()}
          className="min-h-8 rounded-lg border border-[#7A5B25] px-3 text-xs font-semibold text-[#5A4210] hover:bg-[#E8D9B0] disabled:opacity-60"
        >
          {resetLabel}
        </button>
      )}
      {reset.isError && (
        <span role="alert" className="text-xs font-normal">
          Chưa về được ngày thật. Đăng nhập lại bằng tài khoản Admin rồi thử lại.
        </span>
      )}
    </div>
  );
}
