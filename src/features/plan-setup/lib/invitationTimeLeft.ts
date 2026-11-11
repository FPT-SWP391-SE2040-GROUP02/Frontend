const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Thời gian còn lại của lời mời, viết cho người đọc: "9 phút", "3 giờ 20 phút", "2 ngày 4 giờ".
 * Làm tròn lên phút để không hiện "0 phút" khi lời mời còn vài giây. Hết hạn rồi thì trả null.
 */
export function invitationTimeLeft(expiresAt: string, nowMs: number): string | null {
  const leftMs = new Date(expiresAt).getTime() - nowMs;
  if (Number.isNaN(leftMs) || leftMs <= 0) return null;
  const totalMinutes = Math.ceil(leftMs / MINUTE_MS);
  const days = Math.floor((totalMinutes * MINUTE_MS) / DAY_MS);
  const hours = Math.floor(((totalMinutes * MINUTE_MS) % DAY_MS) / HOUR_MS);
  const minutes = totalMinutes % 60;
  if (days > 0) {
    if (hours > 0) return `${days} ngày ${hours} giờ`;
    return `${days} ngày`;
  }
  if (hours > 0) {
    if (minutes > 0) return `${hours} giờ ${minutes} phút`;
    return `${hours} giờ`;
  }
  return `${minutes} phút`;
}
