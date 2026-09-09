/**
 * @description Các hàm tiện ích định dạng dữ liệu chuẩn Việt Nam.
 */

/**
 * @description Định dạng số thành chuỗi tiền tệ Việt Nam Đồng (VNĐ).
 * @param {number} amount Số tiền cần định dạng (ví dụ: 150000)
 * @returns {string} Chuỗi tiền tệ đã định dạng (ví dụ: "150.000 ₫")
 * @example
 * formatCurrency(150000); // "150.000 ₫"
 */
export function formatCurrency(amount: number): string {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "0 ₫";
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/**
 * @description Định dạng chuỗi ngày tháng hoặc đối tượng Date thành định dạng ngày tháng Việt Nam (DD/MM/YYYY).
 * @param {string | Date} date Ngày cần định dạng
 * @param {boolean} [includeTime=false] Có hiển thị kèm giờ phút hay không (mặc định false)
 * @returns {string} Chuỗi ngày tháng đã định dạng (ví dụ: "09/09/2026" hoặc "14:30 09/09/2026")
 * @example
 * formatDate(new Date()); // "09/09/2026"
 * formatDate(new Date(), true); // "14:30 09/09/2026"
 */
export function formatDate(date: string | Date, includeTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return "";

  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime && {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
  return new Intl.DateTimeFormat("vi-VN", options).format(d);
}

/**
 * @description Rút gọn chuỗi dài và thêm dấu ba chấm (...).
 * @param {string} text Chuỗi ban đầu
 * @param {number} maxLength Độ dài tối đa cho phép trước khi cắt ngắn
 * @returns {string} Chuỗi đã rút gọn
 * @example
 * truncateText("Một chuỗi rất dài cần rút gọn", 10); // "Một chuỗi..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}
