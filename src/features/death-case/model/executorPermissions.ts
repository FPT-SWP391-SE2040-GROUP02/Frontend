/** Việc Người thực thi làm được và không làm được; dùng cho thẻ gọn ở Tổng quan và trang Quyền hạn. */
export const EXECUTOR_ALLOWED: string[] = [
  "Xem ghi chú của Chủ kho",
  "Điểm danh thay khi Chủ kho trễ điểm danh",
  "Nộp giấy chứng tử (báo tin) và bản bổ sung",
  "Theo dõi tiến trình bàn giao",
  "Nhận thông báo cho từng bước",
];

export const EXECUTOR_DENIED: string[] = [
  "Đọc nội dung kho",
  "Sửa, xóa tài sản hoặc đổi người nhận",
  "Tự duyệt hồ sơ hoặc bỏ qua bước xét duyệt",
  "Làm người nhận trong kho này",
];
