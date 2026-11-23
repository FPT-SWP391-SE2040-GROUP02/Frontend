/** Việc Người thực thi làm được và không làm được; dùng cho thẻ gọn ở Tổng quan và trang Quyền hạn. */
export const EXECUTOR_ALLOWED: string[] = [
  "Xem ghi chú của Chủ kho",
  "Nhận thông báo khi người nhận gửi yêu cầu nhận tài sản",
  "Giao tài sản theo biên bản luật sư đã ký",
  "Gửi mã nhận và ký phiếu giao nhận với người nhận",
  "Theo dõi tiến trình bàn giao",
  "Nhận thông báo cho từng bước",
];

export const EXECUTOR_DENIED: string[] = [
  "Đọc nội dung kho",
  "Tự chia, bán, cho tài sản hoặc đổi người nhận",
  "Sửa biên bản bàn giao (việc của luật sư)",
  "Làm người nhận trong kho này",
];
