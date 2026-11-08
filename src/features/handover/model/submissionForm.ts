export type SubmissionKind = "ACCEPT" | "DECLINE";

/** Giá trị người nhận đang điền trên văn bản mẫu; ảnh là tệp người dùng chọn, chưa gửi đi đâu. */
export interface SubmissionDraft {
  kind: SubmissionKind;
  fullName: string;
  citizenId: string;
  dateOfBirth: string;
  front: File | null;
  back: File | null;
  acknowledged: boolean;
  voluntaryDecline: boolean;
}

/** Ảnh căn cước tối đa 8 MiB mỗi ảnh (khớp EkycRules.MaxImageBytes của Backend). */
export const MAX_SUBMISSION_IMAGE_BYTES = 8 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function imageError(file: File | null, label: string): string | null {
  if (!file) return `Vui lòng chọn ảnh ${label}.`;
  if (!IMAGE_TYPES.includes(file.type)) return `Ảnh ${label} phải là JPEG, PNG hoặc WEBP.`;
  if (file.size === 0 || file.size > MAX_SUBMISSION_IMAGE_BYTES)
    return `Ảnh ${label} không được rỗng và tối đa 8 MiB.`;
  return null;
}

/**
 * Lỗi đầu tiên của bản điền (null khi hợp lệ). Chỉ kiểm hình thức ở máy; việc khớp với thông tin Chủ kho khai
 * do Backend kiểm lúc nộp, nên không báo trước khớp hay lệch để không dò được dữ liệu.
 */
export function submissionFormError(draft: SubmissionDraft, today = new Date()): string | null {
  if (draft.fullName.trim().length === 0) return "Vui lòng nhập họ tên.";
  if (draft.dateOfBirth.length === 0) return "Vui lòng nhập ngày sinh.";
  const birth = new Date(draft.dateOfBirth);
  if (Number.isNaN(birth.getTime()) || birth.getTime() > today.getTime())
    return "Ngày sinh không hợp lệ.";
  if (!/^\d{12}$/.test(draft.citizenId)) return "Số căn cước gồm 12 chữ số.";
  const front = imageError(draft.front, "căn cước mặt trước");
  if (front) return front;
  const back = imageError(draft.back, "căn cước mặt sau");
  if (back) return back;
  if (!draft.acknowledged) return "Vui lòng xác nhận đã đọc điều khoản của lựa chọn này.";
  if (draft.kind === "DECLINE" && !draft.voluntaryDecline)
    return "Vui lòng xác nhận tự nguyện từ chối, không nhằm trốn tránh nghĩa vụ tài sản.";
  return null;
}
