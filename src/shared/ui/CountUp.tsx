import { useEffect, useRef, useState } from "react";

/** Người dùng bật "giảm chuyển động", hoặc môi trường không có matchMedia (test): không chạy hiệu ứng. */
function reducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Con số chạy lên tới giá trị mới (lần đầu từ 0), dùng cho các ô tóm tắt. Giá trị thật luôn là `value`: bật giảm
 * chuyển động thì hiện thẳng, không chạy. Chữ số cùng độ rộng để số không nhảy ngang khi đang chạy.
 */
export function CountUp({ value, durationMs = 800 }: { value: number; durationMs?: number }) {
  const reduce = reducedMotion();
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (reduce) return;
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      // ease-out: chạy nhanh lúc đầu, chậm dần khi tới số cuối.
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(origin + (value - origin) * eased);
      setShown(next);
      from.current = next;
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs, reduce]);
  return <span className="tabular-nums">{reduce ? value : shown}</span>;
}
