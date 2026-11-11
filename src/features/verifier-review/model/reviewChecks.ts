/**
 * Ba dòng Người thực thi khai mà Người xét duyệt đối chiếu với ảnh giấy chứng tử; tích đủ cả ba mới mở được nút Duyệt.
 * Họ tên và ngày sinh Chủ kho lấy từ xác minh danh tính nên không còn ô đối chiếu riêng.
 */
export const REVIEW_CHECKS = [
  "Ngày mất khớp với giấy",
  "Ngày đăng ký khai tử khớp với giấy",
  "Nơi đăng ký khai tử khớp với giấy",
] as const;

/** Số dòng phải tích đủ để duyệt. */
export const REVIEW_CHECK_COUNT = REVIEW_CHECKS.length;

/** Dòng nhắc khi chưa tích đủ. */
export const REVIEW_CHECKS_HINT =
  "Đánh dấu đủ 3 dòng khớp với giấy mới duyệt được. Dòng nào lệch thì chọn Yêu cầu bổ sung.";
