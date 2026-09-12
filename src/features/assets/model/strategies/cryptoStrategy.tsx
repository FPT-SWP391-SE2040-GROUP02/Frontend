// ==============================================================================
// SWP391 - LegacyVault: Crypto Asset Strategy (Strategy Pattern Implementation)
// Xử lý riêng biệt cho tài sản Tiền mã hóa & Web3 (Seed phrase, Private Key, Ví)
// ==============================================================================

import {
  ASSET_CATEGORY,
  ASSET_DATA_TYPE,
  type AssetCategory,
  type AssetDataType,
  type EncryptedPayload,
  type CreateAssetFormValues,
} from "@/entities/asset";
import { Input, Label, Textarea } from "@/shared/ui";
import type { ReactNode } from "react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { AssetStrategy } from "./assetStrategy.interface";

/** Kiểu dữ liệu form dành riêng cho Crypto */
export interface CryptoFormData {
  walletAddress: string;
  seedPhrase?: string;
  privateKey?: string;
  network: string;
}

/**
 * @description Chiến lược xử lý danh mục tài sản Tiền mã hóa & Web3.
 * Đảm nhiệm việc validate, mã hóa client-side và render UI nhập liệu ví/khóa bí mật.
 */
export class CryptoStrategy implements AssetStrategy<CryptoFormData> {
  public readonly category: AssetCategory = ASSET_CATEGORY.CRYPTO;

  public readonly supportedDataTypes: AssetDataType[] = [
    ASSET_DATA_TYPE.SEED_PHRASE,
    ASSET_DATA_TYPE.PRIVATE_KEY,
    ASSET_DATA_TYPE.WALLET_ADDRESS,
  ];

  /**
   * @description Kiểm tra tính hợp lệ của dữ liệu Crypto (ví Web3, seed phrase, private key).
   * @param {unknown} _data Dữ liệu thô từ form nhập liệu
   * @returns {boolean} Kết quả kiểm tra
   * @throws {Error} Ném ra lỗi nếu phương thức chưa được cài đặt
   * @example
   * ```ts
   * const isValid = cryptoStrategy.validate(formData);
   * ```
   */
  public validate(_data: unknown): boolean {
    // TODO: 1. Sử dụng cryptoSecretSchema từ @/entities/asset để safeParse(_data)
    // TODO: 2. Kiểm tra ít nhất một trong hai trường: seedPhrase hoặc privateKey phải có dữ liệu
    // TODO: 3. Kiểm tra địa chỉ ví walletAddress có khớp chuẩn EVM (0x...) hoặc Bitcoin
    // TODO: 4. Trả về kết quả true/false
    throw new Error(
      "Chưa cài đặt validate cho CryptoStrategy - Vui lòng tự hoàn thiện logic tại đây.",
    );
  }

  /**
   * @description Mã hóa client-side khóa bí mật Web3 (AES-GCM 256-bit).
   * @param {CryptoFormData} _rawData Dữ liệu ví và khóa bí mật thô
   * @returns {EncryptedPayload} Dữ liệu đã mã hóa gồm ciphertext, iv, authTag
   * @throws {Error} Ném ra lỗi nếu phương thức chưa được cài đặt
   * @example
   * ```ts
   * const encrypted = cryptoStrategy.preparePayload(cryptoData);
   * ```
   */
  public preparePayload(_rawData: CryptoFormData): EncryptedPayload {
    // TODO: 1. Serialize dữ liệu _rawData thành chuỗi JSON: JSON.stringify(_rawData)
    // TODO: 2. Sinh ngẫu nhiên Initialization Vector (IV) 12 bytes bằng Web Crypto API: window.crypto.getRandomValues()
    // TODO: 3. Sử dụng Master Key của người dùng để mã hóa chuỗi JSON bằng thuật toán AES-GCM
    // TODO: 4. Trích xuất ciphertext và authTag dưới định dạng Base64
    // TODO: 5. Trả về đối tượng EncryptedPayload chuẩn
    throw new Error(
      "Chưa cài đặt preparePayload cho CryptoStrategy - Vui lòng tự hoàn thiện logic tại đây.",
    );
  }

  /**
   * @description Render các trường nhập liệu chuyên biệt cho Crypto trong Modal/Form.
   * @param {Control<CreateAssetFormValues>} control Control của React Hook Form
   * @param {FieldErrors<CreateAssetFormValues>} errors Object chứa các lỗi validate
   * @returns {ReactNode} JSX UI nhập liệu ví và khóa
   * @example
   * ```tsx
   * return cryptoStrategy.renderFormFields(control, errors);
   * ```
   */
  public renderFormFields(
    control: Control<CreateAssetFormValues>,
    errors: FieldErrors<CreateAssetFormValues>
  ): ReactNode {
    const cryptoErrors = errors.secretPayload as FieldErrors<CryptoFormData> | undefined;

    return (
      <div className="space-y-4">
        {/* Trường nhập Mạng Blockchain */}
        <div className="space-y-1.5">
          <Label htmlFor="network">Mạng Blockchain (Network)</Label>
          <Controller
            name="secretPayload.network"
            control={control}
            defaultValue="Ethereum (ERC-20)"
            render={({ field }) => (
              <Input
                id="network"
                placeholder="Ví dụ: Ethereum Mainnet, BNB Chain, Solana..."
                {...field}
              />
            )}
          />
          {cryptoErrors?.network && (
            <p className="text-xs text-destructive">
              {String(cryptoErrors.network.message)}
            </p>
          )}
        </div>

        {/* Trường nhập Địa chỉ Ví */}
        <div className="space-y-1.5">
          <Label htmlFor="walletAddress">Địa chỉ Ví Công Khai (Public Wallet Address)</Label>
          <Controller
            name="secretPayload.walletAddress"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Input id="walletAddress" placeholder="0x... hoặc bc1..." {...field} />
            )}
          />
          {cryptoErrors?.walletAddress && (
            <p className="text-xs text-destructive">
              {String(cryptoErrors.walletAddress.message)}
            </p>
          )}
        </div>

        {/* Trường nhập Cụm từ khôi phục (Seed Phrase) */}
        <div className="space-y-1.5">
          <Label htmlFor="seedPhrase">
            Cụm từ khôi phục 12/24 từ (Seed Phrase - Mã hóa đầu cuối)
          </Label>
          <Controller
            name="secretPayload.seedPhrase"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Textarea
                id="seedPhrase"
                rows={3}
                placeholder="Nhập 12 hoặc 24 từ tiếng Anh cách nhau bởi dấu cách..."
                {...field}
              />
            )}
          />
          {cryptoErrors?.seedPhrase && (
            <p className="text-xs text-destructive">
              {String(cryptoErrors.seedPhrase.message)}
            </p>
          )}
        </div>

        {/* Trường nhập Private Key */}
        <div className="space-y-1.5">
          <Label htmlFor="privateKey">Khóa bí mật (Private Key - Hex 64 ký tự)</Label>
          <Controller
            name="secretPayload.privateKey"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Input
                id="privateKey"
                type="password"
                placeholder="Khóa riêng tư Hex bắt đầu bằng 0x..."
                {...field}
              />
            )}
          />
          {cryptoErrors?.privateKey && (
            <p className="text-xs text-destructive">
              {String(cryptoErrors.privateKey.message)}
            </p>
          )}
        </div>
      </div>
    );
  }
}

