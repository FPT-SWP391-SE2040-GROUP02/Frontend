/** Giới hạn từ CreatePackageRequestValidator và UpdatePackageRequestValidator. */
export const PACKAGE_LIMITS = {
  NAME_MAX_LENGTH: 120,
  DESCRIPTION_MAX_LENGTH: 1000,
} as const;

/** Nhãn field dùng chung cho thông báo validation của gói bàn giao. */
export const PACKAGE_FIELD_LABELS = {
  NAME: "Tên gói",
  DESCRIPTION: "Mô tả",
} as const;

/** DTO ánh xạ Application.Features.Packages.PackageResponse. */
export interface PackageResponse {
  /** GUID gói bàn giao. */
  id: string;
  /** Tên gói do server trả về sau khi chuẩn hóa. */
  name: string;
  /** Mô tả; server trả null khi không có. */
  description: string | null;
  /** Thời điểm tạo theo ISO 8601 UTC. */
  createdAt: string;
  /** Thời điểm cập nhật theo ISO 8601 UTC. */
  updatedAt: string;
}

/** DTO tạo gói; Backend chấp nhận description thiếu hoặc null. */
export interface CreatePackageRequest {
  /** Bắt buộc, không chỉ chứa khoảng trắng; tối đa theo PACKAGE_LIMITS. */
  name: string;
  /** Mô tả tùy chọn, giữ nguyên giá trị gửi tới Backend. */
  description?: string | null;
}

/**
 * DTO cập nhật theo snapshot BE hiện tại: name vẫn bắt buộc dù route dùng PATCH.
 * Thiếu description có thể xóa mô tả; caller cần gửi giá trị muốn giữ.
 */
export type UpdatePackageRequest = CreatePackageRequest;
