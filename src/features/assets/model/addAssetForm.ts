import { formatStorageSize } from "@/shared/lib/formatStorageSize";

/** Mã phần tử ô tên của form thêm mục. */
export const ADD_ASSET_NAME_ID = "add-asset-name";
/**
 * Giới hạn dung lượng tệp tải lên (byte, thập phân 500.000.000 = 500 MB theo cách
 * formatStorageSize hiển thị). Nhỏ hơn StorageLimits.MaxUploadBytes (500 MiB) của Backend nên mọi
 * tệp qua kiểm tra này đều được máy chủ chấp nhận; hiển thị dùng formatStorageSize cho tròn "500 MB".
 */
export const MAX_ASSET_FILE_BYTES = 500_000_000;

/**
 * Kiểm tra tệp tài sản theo đúng thứ tự ưu tiên; trả thông báo lỗi cụ thể, rỗng nếu hợp lệ.
 * Mỗi trường hợp có một câu riêng để người dùng biết chính xác cách sửa.
 */
export function validateAssetFile(
  file: File | null,
  remainingBytes: number,
): string {
  if (!file) return "Vui lòng chọn tệp tài sản.";
  if (file.size === 0) return "Tệp đã chọn rỗng (0 bytes). Vui lòng chọn tệp hợp lệ.";
  if (file.size > MAX_ASSET_FILE_BYTES) {
    return `Kích thước tệp vượt quá giới hạn tối đa (${formatStorageSize(MAX_ASSET_FILE_BYTES)}).`;
  }
  if (file.size > remainingBytes) {
    return `Dung lượng tệp (${formatStorageSize(file.size)}) vượt quá dung lượng khả dụng còn lại của kho (${formatStorageSize(remainingBytes)}).`;
  }
  return "";
}
