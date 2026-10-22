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
