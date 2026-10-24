import type { z } from "zod";
import type { checkInStatusSchema } from "./checkIn.schema";

type DailyStatus = Pick<
  z.infer<typeof checkInStatusSchema>,
  "planStatus" | "lastCheckInAt" | "serverTime"
>;
const DAY_MS = 24 * 60 * 60 * 1000;
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Cùng quy tắc ngày Việt Nam của BE; không lấy ngày từ đồng hồ trình duyệt. */
export function dailyCheckInState(status: DailyStatus) {
  const now = Date.parse(status.serverTime);
  const last = status.lastCheckInAt === null ? null : Date.parse(status.lastCheckInAt);
  const today = Math.floor((now + VIETNAM_OFFSET_MS) / DAY_MS);
  const checkedInToday = last !== null && Math.floor((last + VIETNAM_OFFSET_MS) / DAY_MS) >= today;
  const planAllowsCheckIn = ["ACTIVE", "CHECKIN_OVERDUE", "AWAITING_CHECK"].includes(
    status.planStatus,
  );
  return { checkedInToday, planAllowsCheckIn, canCheckIn: planAllowsCheckIn && !checkedInToday };
}

/** Đọc trạng thái từ đồng hồ tối đa mỗi 30s và tại ranh giới ngày theo giờ server. */
export function checkInRefreshInterval(serverTime?: string): number {
  if (!serverTime) return 30_000;
  const now = Date.parse(serverTime);
  const nextMidnight =
    (Math.floor((now + VIETNAM_OFFSET_MS) / DAY_MS) + 1) * DAY_MS - VIETNAM_OFFSET_MS;
  return Math.max(1000, Math.min(30_000, nextMidnight - now));
}
