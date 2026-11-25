/** Việc Người thực thi làm được và không làm được; dùng cho thẻ gọn ở Tổng quan và trang Quyền hạn. */
export const EXECUTOR_ALLOWED: string[] = [
  "Xem ghi chú của Chủ kho",
  "Xem tên và loại tài sản trong kho",
  "Nhận thông báo khi người nhận gửi yêu cầu nhận tài sản",
  "Ký biên bản bàn giao luật sư đã lập",
  "Gửi mã nhận cho từng người nhận khi lượt của người đó đã được mở",
  "Theo dõi tiến trình bàn giao",
  "Nhận thông báo cho từng bước",
];

export const EXECUTOR_DENIED: string[] = [
  "Đọc nội dung kho",
  "Tự chia, bán, cho tài sản hoặc đổi người nhận",
  "Sửa biên bản bàn giao (việc của luật sư)",
  "Làm người nhận trong kho này",
];
