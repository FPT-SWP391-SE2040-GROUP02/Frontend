/**
 * Sáu bước của người nhận, dùng chung cho hướng dẫn ở trang Nhận tài sản, ở cổng người nhận và thanh tiến trình
 * từng lượt. Bước đầu là người nhận tự gửi yêu cầu: hệ thống không tự biết khi nào Chủ kho qua đời.
 */
export const RECEIVE_STEP_TITLES = [
  "Gửi yêu cầu",
  "Luật sư xét giấy tờ",
  "Nộp ảnh căn cước",
  "Luật sư xác nhận danh tính",
  "Ký biên bản",
  "Nhập mã và tải về",
] as const;

/** Giá trị bước khi người nhận đã xong cả sáu bước. */
export const RECEIVE_STEPS_DONE = RECEIVE_STEP_TITLES.length + 1;

/** Câu giải thích của từng bước, cùng thứ tự với RECEIVE_STEP_TITLES; số ngày tải lấy từ tham số Admin đặt. */
export function receiveStepTexts(grantDays: number): string[] {
  return [
    "Khi Chủ kho đã qua đời, bạn bấm Gửi yêu cầu ở dòng kho của mình (hoặc mở link trong thư) và đính kèm di chúc.",
    "Luật sư chấp nhận, yêu cầu bổ sung hoặc từ chối kèm lý do. Chấp nhận thì kho bị khóa, sau đó luật sư lập và chốt biên bản bàn giao.",
    "Chốt biên bản xong, bạn nhận thư mời. Mở cổng người nhận, bấm Bắt đầu rồi nộp ảnh căn cước hai mặt.",
    "Luật sư đối chiếu căn cước với thông tin đã khai. Thiếu hoặc sai thì bạn được yêu cầu nộp lại.",
    "Bạn đọc phần tài sản của mình rồi ký. Luật sư và Người thực thi cũng ký.",
    `Đủ ba chữ ký, Người thực thi gửi mã nhận vào email của bạn (chưa thấy thì liên hệ Người thực thi). Nhập mã, tải tài sản trong ${grantDays} ngày rồi ký phiếu giao nhận.`,
  ];
}
