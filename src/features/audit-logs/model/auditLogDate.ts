/**
 * @description Chuyển ngày local (YYYY-MM-DD) sang ISO 8601 có offset đúng múi giờ máy.
 * Backend so sánh `[from, to)` ở UTC; từ ngày chọn tới 00:00:00 local, tới ngày +1 ngày 00:00:00 local
 * để bao trọn ngày `toDate` theo `to` exclusive.
 */

/** Parse a local calendar day without normalizing impossible dates or years 00–99. */
function parseCalendarDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(`${value}T00:00:00`);
  return year > 0 &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : undefined;
}

/**
 * @description Kiểm tra ngày lịch thực sự tồn tại (kể cả năm nhuận). `new Date("2026-02-31")`
 * âm thầm sang 03/03 nên regex chưa đủ; tách year/month/day rồi round-trip lại.
 */
export function isCalendarDateString(value: unknown): value is string {
  return parseCalendarDate(value) !== undefined;
}

/** Reject invalid URL dates/ranges before fetching; keep filters editable for recovery. */
export function auditLogDateError(from: string | null, to: string | null): string | undefined {
  if ((from && !isCalendarDateString(from)) || (to && !isCalendarDateString(to))) {
    return "Ngày lọc không hợp lệ. Chọn lại ngày hoặc đặt lại bộ lọc.";
  }
  if (from && to && from > to) return "Ngày bắt đầu phải trước hoặc cùng ngày kết thúc.";
  return undefined;
}

/**
 * @param value Chuỗi YYYY-MM-DD đã được `<input type="date">` trả về.
 * @returns ISO offset tương ứng 00:00:00 của ngày đó theo múi giờ máy, hoặc undefined nếu rỗng/sai.
 */
export function localDateToStartOfDayIso(value: string | undefined): string | undefined {
  return parseCalendarDate(value)?.toISOString();
}

/**
 * @param value Chuỗi YYYY-MM-DD.
 * @returns ISO offset của 00:00:00 ngày kế tiếp theo lịch (không cộng 24h để an toàn DST), hoặc undefined.
 * Dùng làm `to` exclusive khi UI nói "đến hết ngày".
 */
export function localDateToNextDayStartIso(value: string | undefined): string | undefined {
  const next = parseCalendarDate(value);
  if (!next) return undefined;
  next.setDate(next.getDate() + 1);
  return next.toISOString();
}
