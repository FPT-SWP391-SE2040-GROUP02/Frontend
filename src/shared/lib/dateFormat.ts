/**
 * Chuẩn hóa định dạng ngày tháng theo DD/MM/YYYY của LegacyVault (locale vi-VN).
 */
const dateOnlyFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeThenDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dayMonthYearFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** "HH:mm dd/MM/yyyy" theo giờ Việt Nam, dùng ở danh sách việc của Người xét duyệt. */
export function formatTimeThenDate(value: string | number | Date | null | undefined): string {
  if (value == null) return "chưa rõ";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "chưa rõ";
  return `${timeThenDateFormatter.format(date)} ${dayMonthYearFormatter.format(date)}`;
}

export function formatDate(value: string | number | Date | null | undefined): string {
  if (value == null) return "Chưa có";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return dateOnlyFormatter.format(date);
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value == null) return "Chưa có";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return dateTimeFormatter.format(date);
}
