import { createElement, useEffect, useState } from "react";
import type { ReactNode } from "react";

type RevealTag = "div" | "li" | "p" | "section";

interface RevealProps {
  as?: RevealTag;
  className?: string;
  /** Độ trễ (ms) để các khối cùng hàng hiện lần lượt thay vì cùng lúc. */
  delay?: number;
  children: ReactNode;
}

/** Người dùng bật "giảm chuyển động" hoặc trình duyệt không có IntersectionObserver thì hiện ngay. */
function shouldSkipAnimation(): boolean {
  if (typeof IntersectionObserver === "undefined") {
    return true;
  }
  if (typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Khối hiện dần và trượt lên nhẹ khi cuộn tới (một lần, không lặp lại khi cuộn ngược).
 * Kiểu hiển thị nằm ở `landing.css` (`.landing-reveal`).
 */
export function Reveal({ as = "div", className = "", delay = 0, children }: RevealProps) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(shouldSkipAnimation);

  useEffect(() => {
    if (element === null || visible) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, visible]);

  let stateClass = "landing-reveal";
  if (visible) {
    stateClass = "landing-reveal is-visible";
  }

  return createElement(
    as,
    {
      ref: setElement,
      className: `${stateClass} ${className}`.trim(),
      style: { transitionDelay: `${delay}ms` },
    },
    children,
  );
}
