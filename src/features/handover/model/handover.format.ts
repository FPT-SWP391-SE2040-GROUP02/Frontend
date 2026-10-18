/**
 * Thời gian còn lại tới hạn, tính theo giờ máy chủ (serverTime) chứ không theo đồng hồ máy người
 * dùng. Chỉ để hiển thị; Backend mới quyết định lượt còn hợp lệ hay không.
 */
export function remainingText(deadline: string, serverTime: string): string {
  const ms = new Date(deadline).getTime() - new Date(serverTime).getTime();
  if (Number.isNaN(ms)) return "";
  if (ms <= 0) return "Đã quá hạn";
  const minutes = Math.floor(ms / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
  if (hours > 0) return `Còn ${hours} giờ ${minutes % 60} phút`;
  return `Còn ${Math.max(minutes, 1)} phút`;
}
