// ==============================================================================
// SWP391 - LegacyVault: Document Asset Strategy (Strategy Pattern Implementation)
// Xử lý riêng biệt cho tài sản Tài liệu mật / Hợp đồng di chúc / File PDF
// ==============================================================================

import type { ReactNode } from "react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import {
  ASSET_CATEGORY,
  ASSET_DATA_TYPE,
  type AssetCategory,
  type AssetDataType,
  type EncryptedPayload,
  type CreateAssetFormValues,
} from "@/entities/asset";
import { Input, Label, Textarea } from "@/shared/ui";
import type { AssetStrategy } from "./assetStrategy.interface";


/** Kiểu dữ liệu form dành riêng cho Document */
export interface DocumentFormData {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileBase64: string;
  description?: string;
}

/**
 * @description Chiến lược xử lý danh mục tài sản Tài liệu mật & Di chúc văn bản.
 * Đảm nhiệm việc validate file đính kèm, mã hóa toàn bộ binary/base64 và hiển thị UI upload.
 */
export class DocumentStrategy implements AssetStrategy<DocumentFormData> {
  public readonly category: AssetCategory = ASSET_CATEGORY.DOCUMENT;

  public readonly supportedDataTypes: AssetDataType[] = [
    ASSET_DATA_TYPE.PDF_CONTRACT,
    ASSET_DATA_TYPE.LEGAL_DEED,
    ASSET_DATA_TYPE.ENCRYPTED_NOTE,
  ];

  /**
   * @description Kiểm tra tính hợp lệ của tài liệu (dung lượng tối đa 10MB, định dạng cho phép).
   * @param {unknown} _data Dữ liệu thô từ form nhập liệu
   * @returns {boolean} Kết quả kiểm tra
   * @throws {Error} Ném ra lỗi nếu phương thức chưa được cài đặt
   * @example
   * ```ts
   * const isValid = documentStrategy.validate(formData);
   * ```
   */
  public validate(_data: unknown): boolean {
    // TODO: 1. Sử dụng documentSecretSchema từ @/entities/asset để safeParse(_data)
    // TODO: 2. Kiểm tra dung lượng fileSizeBytes <= 10 * 1024 * 1024 (10MB)
    // TODO: 3. Kiểm tra định dạng MIME hợp lệ (application/pdf, image/png, image/jpeg, text/plain)
    // TODO: 4. Trả về kết quả true/false
    throw new Error(
      "Chưa cài đặt validate cho DocumentStrategy - Vui lòng tự hoàn thiện logic tại đây.",
    );
  }

  /**
   * @description Mã hóa toàn bộ chuỗi Base64 của tài liệu bằng khóa bí mật (AES-GCM 256-bit).
   * @param {DocumentFormData} _rawData Dữ liệu tài liệu thô
   * @returns {EncryptedPayload} Dữ liệu đã mã hóa gồm ciphertext, iv, authTag
   * @throws {Error} Ném ra lỗi nếu phương thức chưa được cài đặt
   * @example
   * ```ts
   * const encrypted = documentStrategy.preparePayload(docData);
   * ```
   */
  public preparePayload(_rawData: DocumentFormData): EncryptedPayload {
    // TODO: 1. Đóng gói chuỗi JSON từ fileBase64, fileName, mimeType, description
    // TODO: 2. Sinh ngẫu nhiên IV 12 bytes
    // TODO: 3. Mã hóa chuỗi nhị phân/base64 qua Web Crypto API (AES-GCM)
    // TODO: 4. Chuyển đổi kết quả sang Base64 cho ciphertext và authTag
    // TODO: 5. Trả về đối tượng EncryptedPayload chuẩn
    throw new Error(
      "Chưa cài đặt preparePayload cho DocumentStrategy - Vui lòng tự hoàn thiện logic tại đây.",
    );
  }

  /**
   * @description Render các trường nhập liệu chuyên biệt cho Document trong Modal/Form.
   * @param {Control<CreateAssetFormValues>} control Control của React Hook Form
   * @param {FieldErrors<CreateAssetFormValues>} errors Object chứa các lỗi validate
   * @returns {ReactNode} JSX UI upload tài liệu và nhập mô tả
   * @example
   * ```tsx
   * return documentStrategy.renderFormFields(control, errors);
   * ```
   */
  public renderFormFields(
    control: Control<CreateAssetFormValues>,
    errors: FieldErrors<CreateAssetFormValues>,
  ): ReactNode {
    const docErrors = errors.secretPayload as FieldErrors<DocumentFormData> | undefined;

    return (
      <div className="space-y-4">
        {/* Tên tài liệu / Văn bản */}
        <div className="space-y-1.5">
          <Label htmlFor="fileName">Tên văn bản / Giấy tờ pháp lý</Label>
          <Controller
            name="secretPayload.fileName"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Input
                id="fileName"
                placeholder="Ví dụ: Giay_chung_nhan_quyen_su_dung_dat.pdf"
                {...field}
              />
            )}
          />
          {docErrors?.fileName && (
            <p className="text-xs text-destructive">
              {String(docErrors.fileName.message)}
            </p>
          )}
        </div>


        {/* Tải lên tệp tin (File Picker) */}
        <div className="space-y-1.5">
          <Label htmlFor="fileUpload">Chọn tệp tin đính kèm (Tối đa 10MB - PDF, PNG, JPG)</Label>
          <Input
            id="fileUpload"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.txt"
            onChange={(_e) => {
              // TODO: Developer tự hoàn thiện logic FileReader chuyển đổi file sang Base64
              // và cập nhật vào react-hook-form qua setValue('secretPayload.fileBase64', base64)
            }}
          />
        </div>


        {/* Mô tả tóm tắt nội dung */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Tóm tắt nội dung tài liệu / Điều khoản pháp lý (Tùy chọn)</Label>
          <Controller
            name="secretPayload.description"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Textarea
                id="description"
                rows={3}
                placeholder="Ghi chú số công chứng, ngày ký văn bản, cơ quan thẩm quyền..."
                {...field}
              />
            )}
          />
        </div>
      </div>
    );
  }
}
