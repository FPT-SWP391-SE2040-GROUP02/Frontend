/** Lý do dựng sẵn cho hai quyết định không duyệt của Người xét duyệt (theo thiết kế thẩm định). */
export interface ReasonOption {
  value: string;
  label: string;
}

/** "Yêu cầu nộp lại file": đúng là giấy của chủ kho nhưng file chưa đọc được. */
export const RESUBMIT_REASONS: readonly ReasonOption[] = [
  { value: "BLURRY", label: "File mờ, không đọc được chữ" },
  { value: "MISSING_PAGE", label: "Thiếu trang (giấy có 2 trang nhưng chỉ nộp 1)" },
  { value: "CROPPED", label: "Bị cắt mất góc, con dấu hoặc chữ ký" },
  { value: "OTHER", label: "Vấn đề khác" },
];

/** "Từ chối và hủy hồ sơ": giấy không khớp hoặc không đúng loại. Cần mô tả cụ thể. */
export const REJECT_REASONS: readonly ReasonOption[] = [
  { value: "MISMATCH", label: "Thông tin trên giấy không khớp với chủ kho" },
  { value: "NOT_CERTIFICATE", label: "Không phải giấy chứng tử" },
  { value: "SUSPECTED_FORGERY", label: "Nghi ngờ giấy giả hoặc đã bị chỉnh sửa" },
  { value: "OTHER", label: "Lý do khác" },
];

/** Ghép lý do dựng sẵn và ghi chú thành một câu lý do gửi Backend (tối đa 1000 ký tự). */
export function composeReason(label: string, note: string): string {
  const trimmed = note.trim();
  const text = trimmed ? `${label}. ${trimmed}` : label;
  return text.slice(0, 1000);
}

/** Lý do tự điền khi duyệt: bốn mục đối chiếu đã được tích đủ. */
export const APPROVE_REASON =
  "Đã đối chiếu họ tên, số CCCD, ngày sinh và giấy hợp lệ với thông tin gốc.";
