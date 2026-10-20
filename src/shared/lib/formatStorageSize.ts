const STORAGE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/** Dung lượng kho dùng nhãn MB quen thuộc cho đơn vị 1.048.576 byte theo quy ước giao diện. */
export function formatStorageMegabytes(bytes: number): string {
  if (!Number.isSafeInteger(bytes) || bytes < 0) return "—";
  const megabytes = bytes / 1_048_576;
  // Không hiển thị 0 MB khi kho có dữ liệu rất nhỏ.
  if (megabytes > 0 && megabytes < 0.01) return "< 0,01 MB";
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(megabytes)} MB`;
}

/** Đổi byte sang đơn vị thập phân dễ đọc (1 MB = 1.000.000 B), chỉ phục vụ hiển thị. */
export function formatStorageSize(bytes: number): string {
  if (!Number.isSafeInteger(bytes) || bytes < 0) return "—";
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < STORAGE_UNITS.length - 1) {
    value /= 1000;
    unit += 1;
  }
  let digits = unit === 0 ? 0 : unit === 1 ? 1 : 2;
  // Khi làm tròn chạm mốc 1.000, chuyển đơn vị để tránh nhãn như "1.000 KB".
  if (Number(value.toFixed(digits)) >= 1000 && unit < STORAGE_UNITS.length - 1) {
    value /= 1000;
    unit += 1;
    digits = unit === 1 ? 1 : 2;
  }
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value)} ${STORAGE_UNITS[unit]}`;
}
