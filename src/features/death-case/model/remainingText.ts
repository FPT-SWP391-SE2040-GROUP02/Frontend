const HOUR_MS = 60 * 60 * 1000;

/** Thời gian còn lại tính theo serverTime của Backend, không theo đồng hồ máy người dùng. */
export function remainingText(deadline: string, serverTime: string): string {
  const diff = new Date(deadline).getTime() - new Date(serverTime).getTime();
  if (diff <= 0) return "đã quá hạn";
  const hours = Math.floor(diff / HOUR_MS);
  if (hours < 1) return "còn dưới 1 giờ";
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  if (days === 0) return `còn ${restHours} giờ`;
  return restHours === 0 ? `còn ${days} ngày` : `còn ${days} ngày ${restHours} giờ`;
}
