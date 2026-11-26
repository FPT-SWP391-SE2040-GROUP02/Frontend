import { useLayoutEffect, type RefObject } from "react";

/**
 * Vị trí dọc gần nhất của vạch chọn trong menu. Mỗi trang dựng lại cả khung nên vạch của khung mới mặc định ở đầu
 * danh sách; giữ vị trí cũ ở mức module để khung mới trượt từ chỗ vạch vừa đứng sang mục mới.
 */
let lastTop: number | null = null;

function setTransform(indicator: HTMLElement, top: number, animate: boolean): void {
  if (!animate) {
    indicator.style.transition = "none";
  }
  indicator.style.transform = `translateY(${top}px)`;
  if (!animate) {
    // Ép tính lại kiểu để bước nhảy không bị chuyển động bắt lấy, rồi trả lại transition trong CSS.
    void indicator.offsetHeight;
    indicator.style.transition = "";
  }
}

/** Mục đang chọn và đang hiện; mục chỉ dành cho điện thoại bị ẩn trên máy tính thì bỏ qua. */
function findActive(nav: HTMLElement): HTMLElement | null {
  const items = Array.from(nav.querySelectorAll<HTMLElement>('[aria-current="page"]'));
  for (const item of items) {
    if (getComputedStyle(item).display !== "none") {
      return item;
    }
  }
  return null;
}

/** Đặt vạch vào đúng mục đang chọn; không có mục chọn hoặc vạch đang bị ẩn thì ẩn vạch. */
function place(nav: HTMLElement, indicator: HTMLElement, slideFromLast: boolean): void {
  const active = findActive(nav);
  if (active === null || getComputedStyle(indicator).display === "none") {
    indicator.style.visibility = "hidden";
    lastTop = null;
    return;
  }
  const top = active.offsetTop;
  indicator.style.visibility = "visible";
  indicator.style.height = `${active.offsetHeight}px`;
  if (indicator.style.transform === `translateY(${top}px)`) {
    // Đã ở đúng chỗ (ví dụ React StrictMode chạy lại hiệu ứng lúc dev): không nhảy lại, kẻo cắt chuyển động đang chạy.
    lastTop = top;
    return;
  }
  if (slideFromLast && lastTop !== null && lastTop !== top) {
    // Đặt vạch ở chỗ cũ ngay (không chuyển động) rồi đổi sang chỗ mới có chuyển động.
    setTransform(indicator, lastTop, false);
    setTransform(indicator, top, true);
  } else {
    setTransform(indicator, top, false);
  }
  lastTop = top;
}

/**
 * Vạch nền của mục menu đang chọn trượt sang mục mới khi đổi trang (chỉ transform nên chạy trên GPU; tắt khi người
 * dùng chọn giảm chuyển động nhờ CSS). Đổi kích thước menu (xoay màn hình, ẩn hiện menu) thì đặt lại vị trí, không trượt.
 */
export function useNavIndicator(
  navRef: RefObject<HTMLElement | null>,
  indicatorRef: RefObject<HTMLElement | null>,
  activeKey: string | undefined,
): void {
  useLayoutEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (nav === null || indicator === null) {
      return undefined;
    }
    place(nav, indicator, true);
    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }
    // Vạch đã đúng chỗ thì `place` không làm gì, nên lần báo đầu tiên không cắt chuyển động vừa bắt đầu. Quan sát cả
    // nội dung bên trong: khi menu bị giới hạn chiều cao (cuộn), dữ liệu tải về chậm không làm đổi cỡ khung ngoài.
    const observer = new ResizeObserver(() => place(nav, indicator, false));
    observer.observe(nav);
    for (const child of Array.from(nav.children)) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, [navRef, indicatorRef, activeKey]);
}
