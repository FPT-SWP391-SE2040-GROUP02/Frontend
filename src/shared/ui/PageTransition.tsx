import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

const ENTER_KEYFRAMES: Keyframe[] = [
  { opacity: 0, transform: "translateY(10px)" },
  { opacity: 1, transform: "translateY(0)" },
];
const ENTER_OPTIONS: KeyframeAnimationOptions = {
  duration: 260,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
};

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Khung nội dung trang: mỗi lần đổi đường dẫn (và lúc vừa hiện) nội dung mờ dần và nhích lên nhẹ.
 * Chỉ chạy hoạt ảnh trên phần tử, không gắn lại con nên trạng thái form và bộ lọc không mất.
 * Đổi query hoặc hash không chạy lại; máy bật giảm chuyển động thì không chạy.
 */
export function PageTransition({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  // Layout effect để khung đầu tiên đã ở trạng thái mờ, không nháy nội dung đầy đủ rồi mới mờ đi.
  useLayoutEffect(() => {
    const node = ref.current;
    if (node === null || typeof node.animate !== "function" || prefersReducedMotion()) {
      return undefined;
    }
    const animation = node.animate(ENTER_KEYFRAMES, ENTER_OPTIONS);
    return () => animation.cancel();
  }, [pathname]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
