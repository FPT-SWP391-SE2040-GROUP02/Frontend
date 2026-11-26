import { useCallback, useState, useSyncExternalStore } from "react";
import { storage } from "@/shared/utils/storage";

/** Cỡ màn hình bắt đầu có cột menu: khung dùng kiểu Chủ tài sản từ 768px, các khung còn lại từ 1024px. */
export type RailBreakpoint = "md" | "lg";

const QUERIES: Record<RailBreakpoint, string> = {
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
};

/** Màn hình đủ rộng để dùng cột menu thu gọn được. Điện thoại giữ nguyên menu cũ. */
export function useIsRailScreen(breakpoint: RailBreakpoint): boolean {
  const query = QUERIES[breakpoint];
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia?.(query);
      list?.addEventListener?.("change", onChange);
      return () => list?.removeEventListener?.("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia?.(query).matches === true);
}

/**
 * Menu đang thu gọn hay mở. Mỗi trang dựng lại cả khung nên đọc lựa chọn đã lưu ngay lúc dựng, menu không nháy khi đổi
 * trang. Chỉ là sở thích hiển thị, mặc định mở.
 */
export function useRailCollapsed(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(
    () => storage.get<string>(storage.KEYS.SIDE_RAIL) === "collapsed",
  );
  function toggle(): void {
    let next = "collapsed";
    if (collapsed) {
      next = "expanded";
    }
    storage.set(storage.KEYS.SIDE_RAIL, next);
    setCollapsed(!collapsed);
  }
  return [collapsed, toggle];
}
