const DAY_MS = 24 * 60 * 60 * 1000;
const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export interface CheckInRingProps {
  /** Giờ máy chủ lúc đọc trạng thái; vòng đếm theo mốc này, không theo đồng hồ máy người dùng. */
  serverTime: string;
  nextCheckInDueAt: string | null;
  cycleDays: number;
  /** Máy chủ báo đã quá hạn (kể cả khi mốc hạn chưa qua theo giờ hiển thị). */
  overdue: boolean;
}

/**
 * Vòng đếm ngược tới hạn điểm danh: số ngày còn lại ở giữa, phần vòng còn lại tỉ lệ với chu kỳ.
 * Chỉ trình bày số liệu máy chủ đã gửi; không tự suy ra trạng thái điểm danh.
 */
export function CheckInRing({
  serverTime,
  nextCheckInDueAt,
  cycleDays,
  overdue,
}: CheckInRingProps) {
  let remainingMs: number | null = null;
  if (nextCheckInDueAt !== null) {
    remainingMs = new Date(nextCheckInDueAt).getTime() - new Date(serverTime).getTime();
  }
  const isOverdue = overdue || (remainingMs !== null && remainingMs <= 0);

  let fraction = 0;
  let value = "—";
  let caption = "Chưa bắt đầu";
  let label = "Chưa có kỳ điểm danh nào đang chạy";
  if (isOverdue) {
    value = "0";
    caption = "Quá hạn";
    label = "Đã quá hạn điểm danh";
    // Vòng đầy và đỏ để cảnh báo, không để rỗng như "chưa có gì".
    fraction = 1;
  } else if (remainingMs !== null) {
    const days = Math.ceil(remainingMs / DAY_MS);
    fraction = Math.min(1, Math.max(0, remainingMs / (Math.max(cycleDays, 1) * DAY_MS)));
    value = String(days);
    caption = "ngày còn lại";
    label = `Còn ${days} ngày đến hạn điểm danh`;
  }

  return (
    <div className={isOverdue ? "overview-ring is-overdue" : "overview-ring"}>
      <svg viewBox="0 0 168 168" role="img" aria-label={label} className="overview-ring-svg">
        <circle cx="84" cy="84" r={RADIUS} className="overview-ring-track" />
        <circle
          cx="84"
          cy="84"
          r={RADIUS}
          className="overview-ring-value"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          transform="rotate(-90 84 84)"
        />
      </svg>
      <div className="overview-ring-center" aria-hidden="true">
        <strong>{value}</strong>
        <span>{caption}</span>
      </div>
    </div>
  );
}
