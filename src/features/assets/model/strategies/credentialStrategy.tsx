// ==============================================================================
// SWP391 - LegacyVault: Credential Asset Strategy (Strategy Pattern Implementation)
// Xử lý riêng biệt cho tài sản Tài khoản / Mật khẩu / Khóa API / Server SSH
// ==============================================================================

import {
  ASSET_CATEGORY,
  ASSET_DATA_TYPE,
  type AssetCategory,
  type AssetDataType,
  type CreateAssetFormValues,
  type EncryptedPayload,
} from "@/entities/asset";
import { Input, Label, Textarea } from "@/shared/ui";
import type { ReactNode } from "react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { AssetStrategy } from "./assetStrategy.interface";


/** Kiểu dữ liệu form dành riêng cho Credential */
export interface CredentialFormData {
  serviceUrl: string;
  username: string;
  password: string;
  twoFactorSecret?: string;
  notes?: string;
}

/**
 * @description Chiến lược xử lý danh mục tài sản Tài khoản & Mật khẩu.
 * Đảm nhiệm việc validate thông tin đăng nhập, mã hóa và hiển thị giao diện nhập tài khoản.
 */
export class CredentialStrategy implements AssetStrategy<CredentialFormData> {
  public readonly category: AssetCategory = ASSET_CATEGORY.CREDENTIAL;

  public readonly supportedDataTypes: AssetDataType[] = [
    ASSET_DATA_TYPE.WEB_ACCOUNT,
    ASSET_DATA_TYPE.SERVER_SSH,
    ASSET_DATA_TYPE.API_KEY,
  ];

  /**
   * @description Kiểm tra tính hợp lệ của dữ liệu Tài khoản (URL, username, password).
   * @param {unknown} _data Dữ liệu thô từ form nhập liệu
   * @returns {boolean} Kết quả kiểm tra
   * @throws {Error} Ném ra lỗi nếu phương thức chưa được cài đặt
   * @example
   * ```ts
   * const isValid = credentialStrategy.validate(formData);
   * ```
   */
  public validate(_data: unknown): boolean {
    // TODO: 1. Sử dụng credentialSecretSchema từ @/entities/asset để safeParse(_data)
    // TODO: 2. Đảm bảo username và password không được rỗng
    // TODO: 3. Kiểm tra độ dài ghi chú không vượt quá 500 ký tự
    // TODO: 4. Trả về kết quả true/false
    throw new Error(
      "Chưa cài đặt validate cho CredentialStrategy - Vui lòng tự hoàn thiện logic tại đây.",
    );
  }

  /**
   * @description Mã hóa mật khẩu và thông tin đăng nhập (AES-GCM 256-bit).
   * @param {CredentialFormData} _rawData Dữ liệu tài khoản mật khẩu thô
   * @returns {EncryptedPayload} Dữ liệu đã mã hóa gồm ciphertext, iv, authTag
   * @throws {Error} Ném ra lỗi nếu phương thức chưa được cài đặt
   * @example
   * ```ts
   * const encrypted = credentialStrategy.preparePayload(credData);
   * ```
   */
  public preparePayload(_rawData: CredentialFormData): EncryptedPayload {
    // TODO: 1. Serialize dữ liệu _rawData: JSON.stringify(_rawData)
    // TODO: 2. Tạo Initialization Vector (IV) ngẫu nhiên 12 bytes
    // TODO: 3. Mã hóa dữ liệu bằng Web Crypto API (AES-GCM) với Master Key của Vault
    // TODO: 4. Đóng gói ciphertext, initializationVector, authTag dưới dạng Base64
    // TODO: 5. Trả về đối tượng EncryptedPayload chuẩn
    throw new Error(
      "Chưa cài đặt preparePayload cho CredentialStrategy - Vui lòng tự hoàn thiện logic tại đây.",
    );
  }

  /**
   * @description Render các trường nhập liệu chuyên biệt cho Credential trong Modal/Form.
   * @param {Control<CreateAssetFormValues>} control Control của React Hook Form
   * @param {FieldErrors<CreateAssetFormValues>} errors Object chứa các lỗi validate
   * @returns {ReactNode} JSX UI nhập liệu tài khoản và mật khẩu
   * @example
   * ```tsx
   * return credentialStrategy.renderFormFields(control, errors);
   * ```
   */
  public renderFormFields(
    control: Control<CreateAssetFormValues>,
    errors: FieldErrors<CreateAssetFormValues>,
  ): ReactNode {
    const credErrors = errors.secretPayload as FieldErrors<CredentialFormData> | undefined;

    return (
      <div className="space-y-4">
        {/* Trường nhập URL / Tên Dịch Vụ */}
        <div className="space-y-1.5">
          <Label htmlFor="serviceUrl">Trang web / Dịch vụ đăng nhập</Label>
          <Controller
            name="secretPayload.serviceUrl"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Input
                id="serviceUrl"
                placeholder="https://accounts.google.com hoặc AWS Console..."
                {...field}
              />
            )}
          />
          {credErrors?.serviceUrl && (
            <p className="text-xs text-destructive">
              {String(credErrors.serviceUrl.message)}
            </p>
          )}
        </div>

        {/* Trường nhập Username / Email */}
        <div className="space-y-1.5">
          <Label htmlFor="username">Tên đăng nhập / Email</Label>
          <Controller
            name="secretPayload.username"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Input id="username" placeholder="admin@example.com hoặc root" {...field} />
            )}
          />
          {credErrors?.username && (
            <p className="text-xs text-destructive">
              {String(credErrors.username.message)}
            </p>
          )}
        </div>

        {/* Trường nhập Mật khẩu */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Mật khẩu chính (Master Password)</Label>
          <Controller
            name="secretPayload.password"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu an toàn..."
                {...field}
              />
            )}
          />
          {credErrors?.password && (
            <p className="text-xs text-destructive">
              {String(credErrors.password.message)}
            </p>
          )}
        </div>

        {/* Trường nhập Khóa 2FA / Ghi chú bí mật */}
        <div className="space-y-1.5">
          <Label htmlFor="twoFactorSecret">Mã 2FA Secret / Khóa dự phòng (Tùy chọn)</Label>
          <Controller
            name="secretPayload.twoFactorSecret"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Input id="twoFactorSecret" placeholder="Ví dụ: JBSWY3DPEHPK3PXP..." {...field} />
            )}
          />
        </div>

        {/* Trường Ghi chú hướng dẫn đăng nhập */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Hướng dẫn khôi phục / Ghi chú đặc biệt (Tùy chọn)</Label>
          <Controller
            name="secretPayload.notes"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Textarea
                id="notes"
                rows={2}
                placeholder="Ghi chú vị trí lưu USB Key, câu hỏi bảo mật..."
                {...field}
              />
            )}
          />
        </div>
      </div>
    );
  }
}
