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

/** Ngày, tháng, năm của một mốc giờ theo múi giờ Việt Nam, dùng cho dòng "Hôm nay, ngày ... tháng ... năm ..." trên văn bản. */
export function vietnamDayOf(instant: string): { day: string; month: string; year: string } {
  const date = new Date(instant);
  if (Number.isNaN(date.getTime())) return { day: "…", month: "…", year: "……" };
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { day: pick("day"), month: pick("month"), year: pick("year") };
}
