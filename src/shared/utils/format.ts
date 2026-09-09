/**
 * @description Các hàm tiện ích định dạng dữ liệu chuẩn Việt Nam.
 * Tuân thủ Quy tắc 7: Chỉ dựng khung chữ ký hàm và JSDoc, developer tự hoàn thiện logic xử lý.
 */

/**
 * @description Định dạng số thành chuỗi tiền tệ Việt Nam Đồng (VNĐ).
 * @param {_amount} _amount Số tiền cần định dạng (ví dụ: 150000)
 * @returns {string} Chuỗi tiền tệ đã định dạng (ví dụ: "150.000 ₫")
 * @example
 * formatCurrency(150000); // "150.000 ₫"
 */
export function formatCurrency(_amount: number): string {
  // TODO: 1. Kiểm tra đầu vào _amount (nếu không phải số hoặc NaN trả về "0 ₫")
  // TODO: 2. Sử dụng Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }) để format số tiền
  // TODO: 3. Trả về kết quả chuỗi tiền tệ hoàn chỉnh
  throw new Error("Chưa cài đặt formatCurrency - Vui lòng tự hoàn thiện code logic tại đây.");
}

/**
 * @description Định dạng chuỗi ngày tháng hoặc đối tượng Date thành định dạng ngày tháng Việt Nam (DD/MM/YYYY).
 * @param {_date} _date Ngày cần định dạng
 * @param {_includeTime} [_includeTime=false] Có hiển thị kèm giờ phút hay không (mặc định false)
 * @returns {string} Chuỗi ngày tháng đã định dạng (ví dụ: "09/09/2026" hoặc "14:30 09/09/2026")
 * @example
 * formatDate(new Date()); // "09/09/2026"
 * formatDate(new Date(), true); // "14:30 09/09/2026"
 */
export function formatDate(_date: string | Date, _includeTime = false): string {
  // TODO: 1. Khởi tạo đối tượng Date từ tham số _date truyền vào (string hoặc Date)
  // TODO: 2. Kiểm tra nếu _date không hợp lệ (isNaN(d.getTime())) thì trả về chuỗi rỗng ""
  // TODO: 3. Sử dụng Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', ... }) để định dạng
  // TODO: 4. Nếu _includeTime là true, bổ sung hiển thị giờ phút (hour: '2-digit', minute: '2-digit')
  // TODO: 5. Trả về chuỗi ngày giờ hoàn chỉnh
  throw new Error("Chưa cài đặt formatDate - Vui lòng tự hoàn thiện code logic tại đây.");
}

/**
 * @description Rút gọn chuỗi dài và thêm dấu ba chấm (...).
 * @param {_text} _text Chuỗi ban đầu
 * @param {_maxLength} _maxLength Độ dài tối đa cho phép trước khi cắt ngắn
 * @returns {string} Chuỗi đã rút gọn
 * @example
 * truncateText("Một chuỗi rất dài cần rút gọn", 10); // "Một chuỗi..."
 */
export function truncateText(_text: string, _maxLength: number): string {
  // TODO: 1. Kiểm tra nếu chuỗi _text rỗng hoặc độ dài nhỏ hơn hoặc bằng _maxLength thì trả về nguyên bản _text
  // TODO: 2. Cắt chuỗi từ vị trí 0 đến _maxLength bằng _text.slice(0, _maxLength)
  // TODO: 3. Ghép thêm dấu "..." vào cuối chuỗi và trả về kết quả
  throw new Error("Chưa cài đặt truncateText - Vui lòng tự hoàn thiện code logic tại đây.");
}
