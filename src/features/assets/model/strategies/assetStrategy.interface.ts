// ==============================================================================
// SWP391 - LegacyVault: Asset Strategy Interface (Strategy Pattern)
// Định nghĩa giao diện chung cho các chiến lược xử lý tài sản số khác nhau
// ==============================================================================

import type { ReactNode } from "react";
import type { Control, FieldErrors } from "react-hook-form";
import type {
  AssetCategory,
  AssetDataType,
  EncryptedPayload,
  CreateAssetFormValues,
} from "@/entities/asset";

/**
 * @description Interface quy định hành vi chung cho mọi chiến lược tài sản số (Strategy Pattern).
 * Giúp mở rộng thêm loại tài sản mới mà không cần sửa đổi mã nguồn xử lý ở UI (Open/Closed Principle).
 * @template T Kiểu dữ liệu payload thô của loại tài sản cụ thể
 */
export interface AssetStrategy<T = unknown> {
  /** Danh mục tài sản mà chiến lược này phụ trách */
  readonly category: AssetCategory;

  /** Danh sách các loại dữ liệu chi tiết hỗ trợ */
  readonly supportedDataTypes: AssetDataType[];

  /**
   * @description Kiểm tra tính hợp lệ của dữ liệu nhạy cảm đầu vào theo quy tắc riêng của từng loại tài sản.
   * @param {unknown} data Dữ liệu thô từ form nhập liệu
   * @returns {boolean} true nếu dữ liệu hợp lệ, false nếu không hợp lệ
   * @throws {Error} Ném ra lỗi nếu phương thức chưa được cài đặt
   * @example
   * ```ts
   * const isValid = strategy.validate(formData);
   * ```
   */
  validate(data: unknown): boolean;

  /**
   * @description Tiến hành mã hóa Client-side (AES-GCM) và chuẩn bị payload mã hóa.
   * @param {T} rawData Dữ liệu thô cần được mã hóa an toàn
   * @returns {EncryptedPayload} Đối tượng chứa ciphertext, iv, authTag
   * @throws {Error} Ném ra lỗi nếu phương thức chưa được cài đặt
   * @example
   * ```ts
   * const encryptedPayload = strategy.preparePayload(secretData);
   * ```
   */
  preparePayload(rawData: T): EncryptedPayload;

  /**
   * @description Render các trường nhập liệu UI đặc thù của từng loại tài sản trong Form.
   * @param {Control<CreateAssetFormValues>} control Đối tượng control của React Hook Form
   * @param {FieldErrors<CreateAssetFormValues>} errors Danh sách lỗi validation của form
   * @returns {ReactNode} Giao diện JSX chứa các ô input tương ứng
   * @example
   * ```tsx
   * return <div className="space-y-4">{strategy.renderFormFields(control, errors)}</div>;
   * ```
   */
  renderFormFields(
    control: Control<CreateAssetFormValues>,
    errors: FieldErrors<CreateAssetFormValues>
  ): ReactNode;
}

