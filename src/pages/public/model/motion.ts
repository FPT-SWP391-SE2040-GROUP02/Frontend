import { useEffect } from "react";

/** Người dùng bật "giảm chuyển động": hiệu ứng phải hiện thẳng trạng thái cuối. */
export function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Ép tiến độ cuộn về đoạn 0..1. */
export function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

/**
 * Chạy `update` lúc gắn vào trang, rồi mỗi khi cuộn hoặc đổi cỡ cửa sổ (gộp theo khung hình).
 * `update` phải ổn định (bọc `useCallback`) để không đăng ký lại sau mỗi lần vẽ.
 */
export function useScrollFrame(update: () => void): void {
  useEffect(() => {
    let frame = 0;
    function run(): void {
      frame = 0;
      update();
    }
    function schedule(): void {
      if (frame === 0) {
        frame = window.requestAnimationFrame(run);
      }
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.cancelAnimationFrame(frame);
    };
  }, [update]);
}
