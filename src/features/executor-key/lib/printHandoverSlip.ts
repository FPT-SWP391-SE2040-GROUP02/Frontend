/**
 * In phiếu bàn giao bằng hộp thoại in của trình duyệt (người dùng chọn "Lưu thành PDF").
 * Tên tệp PDF gợi ý lấy từ document.title nên đổi tạm rồi trả lại khi in xong hoặc hủy.
 */
export function printHandoverSlip(version: number): void {
  const previousTitle = document.title;
  document.title = `Phieu-ban-giao-ma-mo-goi-ban-${version}`;
  function restoreTitle(): void {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restoreTitle);
  }
  window.addEventListener("afterprint", restoreTitle);
  window.print();
}
