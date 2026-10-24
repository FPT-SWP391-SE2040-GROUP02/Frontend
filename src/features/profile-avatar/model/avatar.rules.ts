/** Dung lượng ảnh đại diện tối đa, khớp AvatarRules.MaxBytes của Backend (2 MiB). */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Loại ảnh Backend nhận; Backend vẫn kiểm theo nội dung thật nên đây chỉ để báo sớm. */
export const AVATAR_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/**
 * Báo sớm lỗi hiển nhiên trước khi gửi. Trả thông báo tiếng Việt, hoặc null khi ảnh có thể gửi.
 * Không thay thế kiểm tra của Backend.
 */
export function avatarFileProblem(file: Pick<File, "size" | "type">): string | null {
  if (file.size === 0) return "Vui lòng chọn ảnh.";
  if (!AVATAR_ACCEPTED_TYPES.some((type) => type === file.type)) {
    return "Chỉ nhận ảnh JPEG, PNG hoặc WebP.";
  }
  if (file.size > AVATAR_MAX_BYTES) return "Ảnh tối đa 2 MB.";
  return null;
}
