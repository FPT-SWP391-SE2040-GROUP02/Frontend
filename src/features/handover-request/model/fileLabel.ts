/** Đuôi tệp viết hoa để gắn nhãn (tối đa 4 ký tự); tệp không có đuôi thì ghi "TỆP". */
export function extensionLabel(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  if (!match) return "TỆP";
  return match[1].slice(0, 4).toUpperCase();
}

/**
 * Cách xem trước theo loại tệp trình duyệt khai. Loại lạ hoặc để trống thì không mở, vì địa chỉ blob chạy
 * cùng nguồn với ứng dụng.
 */
export function previewKind(file: File): "image" | "pdf" | "none" {
  if (file.type === "application/pdf") return "pdf";
  if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "image";
  return "none";
}
