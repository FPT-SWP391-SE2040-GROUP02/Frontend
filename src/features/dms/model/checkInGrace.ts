/** Trạng thái kế hoạch cần hiện dải cảnh báo: đang trong thời gian chờ hoặc đã hết thời gian chờ. */
export const GRACE_PLAN_STATUSES = ["CHECKIN_OVERDUE", "AWAITING_CHECK"];

/** "3 ngày 5 giờ", "5 giờ", "dưới 1 giờ"; tính từ giờ máy chủ để không lệch theo đồng hồ máy người dùng. */
export function formatTimeLeft(fromIso: string, toIso: string): string {
  const millis = new Date(toIso).getTime() - new Date(fromIso).getTime();
  if (millis <= 0) return "dưới 1 giờ";
  const totalHours = Math.floor(millis / 3_600_000);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0 && hours > 0) return `${days} ngày ${hours} giờ`;
  if (days > 0) return `${days} ngày`;
  if (hours > 0) return `${hours} giờ`;
  return "dưới 1 giờ";
}
