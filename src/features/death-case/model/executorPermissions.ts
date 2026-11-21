/** Việc Người thực thi làm được và không làm được; dùng cho thẻ gọn ở Tổng quan và trang Quyền hạn. */
export const EXECUTOR_ALLOWED: string[] = [
  "Xem ghi chú của Chủ kho",
  "Mở bàn giao khi Chủ kho qua đời (không cần nộp giấy tờ)",
  "Ký biên bản bàn giao luật sư đã lập",
  "Gửi mã nhận cho người nhận khi biên bản đủ chữ ký",
  "Theo dõi tiến trình bàn giao",
  "Nhận thông báo cho từng bước",
];

export const EXECUTOR_DENIED: string[] = [
  "Đọc nội dung kho",
  "Tự chia, bán, cho tài sản hoặc đổi người nhận",
  "Sửa biên bản bàn giao (việc của luật sư)",
  "Làm người nhận trong kho này",
];
