import type { RevenueGroupBy } from "./admin.schema";

/** Kỳ doanh thu Admin chọn: hôm nay, tháng này hoặc quý này (theo giờ máy chủ). */
export type RevenuePeriod = "day" | "month" | "quarter";

const pad = (value: number) => String(value).padStart(2, "0");

/** Ngày yyyy-MM-dd của một Date theo giờ địa phương của Date đó. */
export function isoDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Khoảng ngày (yyyy-MM-dd, gồm cả hai đầu) của ngày, tháng hoặc quý chứa `now`. */
export function periodRange(period: RevenuePeriod, now: Date): { from: string; to: string } {
  if (period === "day") return { from: isoDay(now), to: isoDay(now) };
  const first = period === "month" ? now.getMonth() : Math.floor(now.getMonth() / 3) * 3;
  const months = period === "month" ? 1 : 3;
  return {
    from: isoDay(new Date(now.getFullYear(), first, 1)),
    to: isoDay(new Date(now.getFullYear(), first + months, 0)),
  };
}

/**
 * Cách chia bảng của từng kỳ: hôm nay và tháng này chia theo ngày, quý này chia theo tháng,
 * để tổng của kỳ luôn bằng tổng các dòng bên dưới.
 */
export function groupByForPeriod(period: RevenuePeriod): RevenueGroupBy {
  if (period === "quarter") return "month";
  return "day";
}
